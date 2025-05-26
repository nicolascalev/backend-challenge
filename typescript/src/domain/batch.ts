import { spawn } from "child_process";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import prisma from "../../prisma/db";
import axios from "axios";

export interface BatchProcessInput {
  images: File[];
  userId: number;
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
  processImages(input.images, process.id).catch(console.error);

  return process;
}

async function processImages(images: File[], processId: number) {
  const processRecord = await prisma.process.findUnique({
    where: { id: processId },
    include: {
      createdBy: {
        include: {
          Webhook: true
        }
      }
    }
  });

  if (!processRecord) throw new Error("Process not found");

  const outputDir = path.join("public", processRecord.outputUrl); // Assuming "public" is your static root
  await mkdir(outputDir, { recursive: true });

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const originalImagePath = path.join(outputDir, `original_${i + 1}.png`);
    const outputImagePath = path.join(outputDir, `image_${i + 1}.png`);

    // Write the original image
    await writeFile(originalImagePath, imageBuffer);

    // Run ffmpeg to overlay text
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        originalImagePath,
        "-vf",
        `drawtext=text='Image\\: ${
          i + 1
        }':fontcolor=red:fontsize=h*0.05:x=(w-text_w)/2:y=(h-text_h)/2`,
        "-y", // Overwrite output
        outputImagePath,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });

      ffmpeg.on("error", reject);
    });

    // Delete the original file after processing
    await unlink(originalImagePath);
  }

  // Process webhooks if they exist
  const webhooks = processRecord.createdBy.Webhook;
  if (webhooks.length > 0) {
    const webhookPromises = webhooks.map(async (webhook) => {
      const requestConfig = {
        method: webhook.method,
        url: webhook.url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          processId: processId,
          status: "completed",
          outputUrl: processRecord.outputUrl,
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
