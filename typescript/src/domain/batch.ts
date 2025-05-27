import axios from "axios";
import { mkdir, readdir } from "fs/promises";
import * as os from "os";
import * as path from "path";
import { Worker } from "worker_threads";
import prisma from "../../prisma/db";
import { Context } from "hono";

export interface BatchProcessInput {
  images: File[];
  userId: number;
  context: Context;
}

export async function createBatchProcess(input: BatchProcessInput) {
  // Create the process record
  const process = await prisma.process.create({
    data: {
      imageAmount: input.images.length,
      createdById: input.userId,
      outputUrl: `/output/process_${Date.now()}`,
      status: "processing",
    },
  });

  // Start processing in the background
  processImages(input.images, process.id, input.context).catch(console.error);

  return process;
}

async function processImages(
  images: File[],
  processId: number,
  context: Context
) {
  const processRecord = await prisma.process.findUnique({
    where: { id: processId },
    include: {
      createdBy: {
        include: {
          Webhook: true,
        },
      },
    },
  });

  if (!processRecord) throw new Error("Process not found");

  const outputDir = path.join("public", processRecord.outputUrl);
  await mkdir(outputDir, { recursive: true });

  // Create a worker pool with size based on CPU cores (leave one core free for the main thread)
  const numWorkers = Math.max(1, os.cpus().length - 1);
  const workers: Worker[] = [];
  const results: { success: boolean; imageNumber: number; error?: string }[] =
    [];

  // Process images in chunks using the worker pool
  for (let i = 0; i < images.length; i += numWorkers) {
    const chunk = images.slice(i, i + numWorkers);
    const chunkPromises = chunk.map(async (image, chunkIndex) => {
      const imageNumber = i + chunkIndex + 1;
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      const originalImagePath = path.join(
        outputDir,
        `original_${imageNumber}.png`
      );
      const outputImagePath = path.join(outputDir, `image_${imageNumber}.png`);

      return new Promise<void>((resolve, reject) => {
        const worker = new Worker(
          // IMPORTANT: you have to build the project before running this. ps the build might fail
          // but if the js file is there, it will work.
          path.join(__dirname, "../../dist/src/workers/imageProcessor.js"),
          {
            workerData: {
              imageBuffer,
              originalImagePath,
              outputImagePath,
              imageNumber,
            },
          }
        );

        worker.on("message", (result) => {
          results.push(result);
          resolve();
        });

        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        workers.push(worker);
      });
    });

    // Wait for all workers in the current chunk to complete
    await Promise.all(chunkPromises);
  }

  // Terminate all workers
  await Promise.all(workers.map((worker) => worker.terminate()));

  // Check if any images failed to process
  const failedImages = results.filter((r) => !r.success);
  if (failedImages.length > 0) {
    console.error("Failed to process some images:", failedImages);
  }

  // Get the base URL from the request
  const baseUrl = new URL(context.req.url).origin;

  // Get the list of processed images
  const files = await readdir(outputDir);
  const imageUrls = files
    .filter((file) => file.startsWith("image_"))
    .map((file) => `${baseUrl}${processRecord.outputUrl}/${file}`);

  // Process webhooks if they exist
  const webhooks = processRecord.createdBy.Webhook;
  if (webhooks.length > 0) {
    const webhookPromises = webhooks.map(async (webhook) => {
      const requestConfig = {
        method: webhook.method,
        url: webhook.url,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          processId: processId,
          status: "completed",
          imageUrls,
          imageAmount: processRecord.imageAmount,
          finishedProcessingAt: new Date(),
        },
      };

      try {
        const response = await axios(requestConfig);

        // Create webhook event record
        await prisma.webhookEvent.create({
          data: {
            webhookId: webhook.id,
            processId: processId,
            request: requestConfig,
            response: response.data,
            responseStatus: response.status,
          },
        });
      } catch (error: any) {
        // Create webhook event record for failed requests
        await prisma.webhookEvent.create({
          data: {
            webhookId: webhook.id,
            processId: processId,
            request: requestConfig,
            response: { error: error.message },
            responseStatus: error.response?.status || 500,
          },
        });
      }
    });

    // Wait for all webhook requests to complete
    await Promise.all(webhookPromises);
  }

  // Update process record
  await prisma.process.update({
    where: { id: processId },
    data: {
      status: "completed",
      finishedProcessingAt: new Date(),
    },
  });
}
