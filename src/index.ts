import { mergeSlices } from "./functions/merge";
import { slice } from "./functions/slice";
import type { SliceAndMergeOptions } from "./types";
import { createTempDir } from "./utils/io";

export * from "./types";
export * from "./functions/getMediaDuration";
export * from "./functions/detectSilences";
export * from "./functions/formatMedia";
export * from "./functions/merge";
export * from "./functions/replaceAudio";
export * from "./functions/slice";
export * from "./functions/splitFileOnSilences";

/**
 * Slices the input media file based on specified time ranges and merges the slices into a single output file.
 *
 * @param {string} inputFile - Path to the input media file.
 * @param {string} outputFile - Path where the merged output file will be saved.
 * @param {SliceAndMergeOptions} options - Options containing the time ranges for slicing.
 * @returns {Promise<string>} - Promise resolving to the path of the merged output file.
 */
export const sliceAndMerge = async (
  inputFile: string,
  outputFile: string,
  options: SliceAndMergeOptions
): Promise<string> => {
  const sliceOutputDir = await createTempDir();
  const chunks = await slice(inputFile, {
    ranges: options.ranges,
    outputFolder: sliceOutputDir,
  });
  const merged = await mergeSlices(chunks, outputFile);

  return merged;
};
