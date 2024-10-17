import ffmpeg from "fluent-ffmpeg";
import logger from "../utils/logger";
import path from "node:path";

interface SliceOptions {
  ranges: [number, number][]; // Start/end times in seconds
  outputFolder: string;
}

export const slice = async (
  file: string,
  options: SliceOptions
): Promise<string[]> => {
  const outputFiles: string[] = [];
  const fileName = path.basename(file, path.extname(file)); // e.g., "a" from "a.mp4"
  const fileExtension = path.extname(file); // e.g., ".mp4"

  // Process each range
  for (let i = 0; i < options.ranges.length; i++) {
    const [start, end] = options.ranges[i];
    const outputFile = path.join(
      options.outputFolder,
      `${fileName}_${i + 1}${fileExtension}`
    ); // e.g., "a_slice1.mp4"

    await new Promise<void>((resolve, reject) => {
      ffmpeg(file)
        .setStartTime(start) // Start time of the slice
        .setDuration(end - start) // Duration of the slice
        .output(outputFile) // Output file for the slice
        .on("end", () => {
          logger.info(`Sliced video saved as ${outputFile}`);
          outputFiles.push(outputFile);
          resolve();
        })
        .on("error", (err) => reject(err)) // Handle errors
        .run(); // Execute FFmpeg
    });
  }

  // Return array of individual slice output file paths
  return outputFiles;
};
