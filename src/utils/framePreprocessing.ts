import {
  type Frame,
  FramePreprocessingPreset,
  type FramePreprocessingOptions,
} from "../types";
import path from "node:path";
import { promises as fs } from "node:fs";

const preprocessingPresets: Record<
  FramePreprocessingPreset,
  FramePreprocessingOptions
> = {
  [FramePreprocessingPreset.DarkTextOnLightBackground]: {
    grayscale: true,
  },
  [FramePreprocessingPreset.LightTextOnDarkBackground]: {
    grayscale: true,
  },
};

/**
 * Maps preprocessing options to the ffmpeg filter graph used during frame extraction.
 *
 * @param {FramePreprocessingOptions | FramePreprocessingPreset} options - Either a named preset or manual preprocessing flags.
 * @returns {string} ffmpeg filter expression representing the preprocessing steps.
 */
export const mapFramePreprocessingToFilter = (
  options: FramePreprocessingOptions | FramePreprocessingPreset
): string => {
  const { grayscale } =
    preprocessingPresets[options as FramePreprocessingPreset] || options;

  return [grayscale && "format=gray"].filter(Boolean).join(",");
};

/**
 * Collects frame file paths and extracts timestamps from filenames.
 *
 * @param {string} folder - Folder containing the extracted frames.
 * @param {string} prefix - Filename prefix used when writing frames.
 * @param {string} extension - File extension assigned to frames.
 * @param {number} frequency - Frame extraction frequency in seconds.
 * @returns {Promise<Frame[]>} Promise resolving to an array of objects with file paths and timestamps.
 */
export const collectFramePaths = async (
  folder: string,
  prefix: string,
  extension: string,
  frequency: number
): Promise<Frame[]> => {
  const frames: Frame[] = (await fs.readdir(folder))
    .filter(
      (file: string) => file.startsWith(prefix) && file.endsWith(extension)
    )
    .map((file: string) => {
      const filename = path.join(folder, file);
      const frameNumber = file.replace(prefix, "").replace(extension, "");

      return { filename, start: Number.parseInt(frameNumber, 10) * frequency };
    });

  return frames.sort((a, b) => a.start - b.start);
};
