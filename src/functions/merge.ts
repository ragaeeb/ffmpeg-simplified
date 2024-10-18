import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "node:fs";
import logger from "../utils/logger";
import os from "node:os";
import { generateHashFromInputFiles } from "../utils/io";
import path from "node:path";

/**
 * Merges multiple media files into a single output file.
 *
 * @param {string[]} inputFiles - Array of paths to the media files to merge.
 * @param {string} outputFile - Path where the merged file will be saved.
 * @returns {Promise<string>} - Promise resolving to the path of the merged output file.
 */
export const mergeSlices = async (
  inputFiles: string[],
  outputFile: string
): Promise<string> => {
  const concatFile = path.join(
    os.tmpdir(),
    path.format({ name: generateHashFromInputFiles(inputFiles), ext: ".txt" })
  );

  // Prepare the FFmpeg concat file format
  const fileContent = inputFiles.map((file) => `file '${file}'`).join("\n");
  await fs.writeFile(concatFile, fileContent);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"])
        .output(outputFile)
        .output(outputFile)
        .on("end", () => {
          logger.info(`Merged video saved as ${outputFile}`);
          resolve();
        })
        .on("error", (err) => reject(err))
        .run();
    });
  } finally {
    await fs.rm(concatFile, { recursive: true });
  }

  return outputFile;
};
