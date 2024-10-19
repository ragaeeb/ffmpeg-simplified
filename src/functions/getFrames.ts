import ffmpeg from "fluent-ffmpeg";
import type { Frame, GetFramesOptions } from "../types";
import { getVideoDimensions } from "./getVideoDimensions";
import { mapCropOptionsToCropFilter } from "../utils/cropping";
import logger from "../utils/logger";
import {
  collectFramePaths,
  mapFramePreprocessingToFilter,
} from "../utils/framePreprocessing";
import path from "node:path";

/**
 * Retrieves the duration of a media file in seconds.
 *
 * @param {string} filePath - Path to the media file.
 * @returns {Promise<number>} - Promise resolving to the duration of the media file in seconds.
 */
export const getFrames = async (
  videoFile: string,
  options: GetFramesOptions
): Promise<Frame[]> => {
  const [width, height] = await getVideoDimensions(videoFile);
  const { fileExtension = ".jpg", filePrefix = "frame_" } = options;

  return new Promise((resolve, reject) => {
    const filters = [
      `fps=1/${options.frequency}`,
      options.cropOptions &&
        mapCropOptionsToCropFilter(width, height, options.cropOptions),
      options.preprocessingOptions &&
        mapFramePreprocessingToFilter(options.preprocessingOptions),
    ].filter(Boolean) as string[];

    ffmpeg(videoFile)
      .outputOptions([`-vf ${filters}`, "-vsync vfr", "-start_number 0"])
      .output(
        path.join(options.outputFolder, `${filePrefix}%04d${fileExtension}`)
      )
      .on("end", async () => {
        logger.info("Frame extraction completed.");
        const framePaths = await collectFramePaths(
          options.outputFolder,
          filePrefix,
          fileExtension,
          options.frequency
        );
        resolve(framePaths);
      })
      .on("error", (err) => {
        logger.error("Error during frame extraction:", err);
        reject(err);
      })
      .run();
  });
};
