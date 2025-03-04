import { mergeSlices } from "./merge";
import { slice } from "./slice";
import type { SliceAndMergeOptions, TimeRange } from "../types";
import { createTempDir } from "../utils/io";
import { promises as fs } from "node:fs";
import { getMediaDuration } from "./getMediaDuration";

const parseTimecode = (timecode: string): number => {
  const parts = timecode.split(":").map(Number);
  let seconds = 0;
  let multiplier = 1;

  while (parts.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const part = parts.pop()!;
    seconds += part * multiplier;
    multiplier *= 60;
  }

  return seconds;
};

const mapTimeCodeRangesToTimeRanges = (
  timeCodeRanges: string[]
): TimeRange[] => {
  return timeCodeRanges
    .map((timeCodeRange) => timeCodeRange.split("-"))
    .map(([start, end], i) => {
      return { start: parseTimecode(start), end: end ? parseTimecode(end) : 0 };
    });
};

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
  if (options.ranges.length === 0) {
    throw new Error("Ranges array cannot be empty");
  }

  const ranges: TimeRange[] =
    typeof options.ranges[0] === "string"
      ? mapTimeCodeRangesToTimeRanges(options.ranges as string[])
      : (options.ranges as TimeRange[]);

  if (!ranges.at(-1)?.end) {
    const duration = await getMediaDuration(inputFile);
    (ranges.at(-1) as TimeRange).end = duration;
  }

  if (ranges.find((r) => !r.end)) {
    throw new Error(`Invalid ranges specified ${options.ranges.toString()}`);
  }

  const sliceOutputDir = await createTempDir();
  const chunks = await slice(inputFile, {
    ranges,
    outputFolder: sliceOutputDir,
    fast: options.fast,
  });
  const merged = await mergeSlices(chunks, outputFile);

  await fs.rm(sliceOutputDir, { recursive: true });

  return merged;
};
