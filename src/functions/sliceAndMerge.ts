import { promises as fs } from 'node:fs';
import type { Logger, SliceAndMergeOptions, TimeRange } from '@/types';
import { createTempDir } from '../utils/io';
import { getMediaDuration } from './getMediaDuration';
import { mergeSlices } from './merge';
import { slice } from './slice';

/**
 * Converts a HH:MM:SS.sss style timecode into a floating point second value.
 *
 * @param {string} timecode - The string based timecode (supports hours, minutes and seconds).
 * @returns {number} The parsed value expressed in seconds.
 */
const parseTimecode = (timecode: string): number => {
    const parts = timecode.split(':').map(Number);
    let seconds = 0;
    let multiplier = 1;

    while (parts.length > 0) {
        const part = parts.pop()!;
        seconds += part * multiplier;
        multiplier *= 60;
    }

    return seconds;
};

/**
 * Normalises human readable timecode ranges into {@link TimeRange} objects.
 *
 * @param {string[]} timeCodeRanges - Ranges in the form `start-end` using timecode notation.
 * @returns {TimeRange[]} Parsed time ranges ready for slicing.
 */
const mapTimeCodeRangesToTimeRanges = (timeCodeRanges: string[]): TimeRange[] => {
    return timeCodeRanges
        .map((timeCodeRange) => timeCodeRange.split('-'))
        .map(([start, end]) => {
            return { end: end ? parseTimecode(end) : 0, start: parseTimecode(start) };
        });
};

/**
 * Slices the input media file based on specified time ranges and merges the slices into a single output file.
 *
 * @param {string} inputFile - Path to the input media file.
 * @param {string} outputFile - Path where the merged output file will be saved.
 * @param {SliceAndMergeOptions} options - Options containing the time ranges for slicing.
 * @param {Logger} [logger] - Optional logger for debug and info messages.
 * @returns {Promise<string>} - Promise resolving to the path of the merged output file.
 */
export const sliceAndMerge = async (
    inputFile: string,
    outputFile: string,
    options: SliceAndMergeOptions,
    logger?: Logger,
): Promise<string> => {
    if (options.ranges.length === 0) {
        throw new Error('Ranges array cannot be empty');
    }

    const ranges: TimeRange[] =
        typeof options.ranges[0] === 'string'
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
    const chunks = await slice(
        inputFile,
        {
            fast: options.fast,
            outputFolder: sliceOutputDir,
            ranges,
        },
        logger,
    );
    const merged = await mergeSlices(chunks, outputFile, {}, logger);

    await fs.rm(sliceOutputDir, { recursive: true });

    return merged;
};
