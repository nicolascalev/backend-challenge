import { spawn } from "child_process";
import { unlink, writeFile } from "fs/promises";
import { parentPort, workerData } from "worker_threads";

async function processImage(data: {
  imageBuffer: Buffer;
  originalImagePath: string;
  outputImagePath: string;
  imageNumber: number;
}) {
  const { imageBuffer, originalImagePath, outputImagePath, imageNumber } = data;

  try {
    // Write the original image
    await writeFile(originalImagePath, imageBuffer);

    // Run ffmpeg to overlay text
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        originalImagePath,
        "-vf",
        `drawtext=text='Image\\: ${imageNumber}':fontcolor=red:fontsize=h*0.05:x=(w-text_w)/2:y=(h-text_h)/2`,
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

    parentPort?.postMessage({ success: true, imageNumber });
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      imageNumber,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Start processing when worker receives data
if (workerData) {
  processImage(workerData);
}
