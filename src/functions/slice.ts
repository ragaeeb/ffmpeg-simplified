import ffmpeg from "../vendor/ffmpegy";
import logger from "../utils/logger";
import path from "node:path";
import type { SliceOptions } from "../types";
import os from "node:os";

/**
 * Slices a media file into multiple parts based on specified time ranges.
 *
 * @param {string} file - Path to the input media file.
 * @param {SliceOptions} options - Options containing the time ranges and output folder.
 * @returns {Promise<string[]>} - Promise resolving to an array of paths to the sliced files.
 */
export const slice = async (
  file: string,
  options: SliceOptions
): Promise<string[]> => {
  const outputFiles: string[] = [];
  const fileName = path.basename(file, path.extname(file)); // e.g., "a" from "a.mp4"
  const fileExtension = path.extname(file); // e.g., ".mp4"

  for (let i = 0; i < options.ranges.length; i++) {
    const { start, end } = options.ranges[i];
    const outputFile = path.join(
      options.outputFolder,
      `${fileName}_${i + 1}${fileExtension}`
    ); // e.g., "a_slice1.mp4"

    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(file)
        .setStartTime(start)
        .setDuration(end - start)
        .output(outputFile);

      if (options.fast) {
        command = command.outputOptions([`-threads ${os.cpus().length}`]);
        logger.debug(
          `Using fast mode with ${os.cpus().length} threads for slicing`
        );
      }

      command
        .on("end", () => {
          logger.info(`Sliced video saved as ${outputFile}`);
          outputFiles.push(outputFile);
          resolve();
        })
        .on("error", (err) => reject(err))
        .run();
    });
  }

  return outputFiles;
};
