import ffmpeg from "fluent-ffmpeg";
import logger from "../utils/logger";
import path from "node:path";
import type {
  AudioChunk,
  SplitOnSilenceCallbacks,
  SplitOptions,
  TimeRange,
} from "../types";
import {
  DEFAULT_SHORT_CLIP_PADDING,
  SPLIT_OPTIONS_DEFAULTS,
} from "./constants";
import deepmerge from "deepmerge";
import { getMediaDuration } from "./getMediaDuration";
import { detectSilences } from "./detectSilences";

/**
 * Splits an audio timeline into non-silent "voice" segments by dividing
 * the total duration into fixed-size chunks and trimming off purely silent parts.
 *
 * @param {TimeRange[]} silenceResults - Detected silence intervals (in seconds).
 * @param {number} chunkDuration - Maximum duration (in seconds) for each chunk.
 * @param {number} totalDuration - Total duration (in seconds) of the audio.
 * @returns {TimeRange[]} Array of non-silent time ranges representing voice segments.
 */
export const mapSilenceResultsToChunkRanges = (
  silenceResults: TimeRange[],
  chunkDuration: number,
  totalDuration: number
): TimeRange[] => {
  // if the chunk size exceeds the whole audio, just return the full range
  if (chunkDuration >= totalDuration) {
    return [{ start: 0, end: totalDuration }];
  }

  const chunks: TimeRange[] = [];
  let currentStart = 0;

  // helper: returns true if [start,end] is wholly inside any silence range
  const isFullySilent = (start: number, end: number) =>
    silenceResults.some((s) => start >= s.start && end <= s.end);

  while (currentStart < totalDuration) {
    const chunkEnd = Math.min(currentStart + chunkDuration, totalDuration);

    // find any silences that begin inside this chunk
    const relevantSilences = silenceResults
      .filter((s) => s.start > currentStart && s.start <= chunkEnd)
      .sort((a, b) => b.start - a.start);

    const segStart = currentStart;
    let segEnd: number;

    if (relevantSilences.length > 0) {
      // cut off at the start of the last silence in this chunk
      segEnd = relevantSilences[0].start;
      currentStart = relevantSilences[0].start;
    } else {
      // no silence begins in here: take the full chunk
      segEnd = chunkEnd;
      currentStart = chunkEnd;
    }

    // only keep it if it's non-zero length and not purely silent
    if (segEnd > segStart && !isFullySilent(segStart, segEnd)) {
      chunks.push({ start: segStart, end: segEnd });
    }
  }

  return chunks;
};

/**
 * Splits an audio file into chunks based on silence detection.
 *
 * @param {string} filePath - Path to the input audio file.
 * @param {string} outputDir - Directory where the audio chunks will be saved.
 * @param {SplitOptions} [options] - Optional settings for splitting the file.
 * @param {SplitOnSilenceCallbacks} [callbacks] - Optional callbacks for progress tracking.
 * @returns {Promise<AudioChunk[]>} - Promise resolving to an array of audio chunks with file names and time ranges.
 */
export const splitFileOnSilences = async (
  filePath: string,
  outputDir: string,
  options?: SplitOptions,
  callbacks?: SplitOnSilenceCallbacks
): Promise<AudioChunk[]> => {
  const parsedPath = path.parse(filePath);

  logger.debug(`Split file ${filePath}`);

  const {
    chunkDuration,
    chunkMinThreshold,
    silenceDetection: { silenceDuration, silenceThreshold },
  } = deepmerge(SPLIT_OPTIONS_DEFAULTS, options || {});

  logger.info(
    `Using chunkDuration=${chunkDuration}, chunkMinThreshold=${chunkMinThreshold}, silenceThreshold=${silenceThreshold}, silenceDuration=${silenceDuration}`
  );

  const totalDuration = await getMediaDuration(filePath);

  if (chunkDuration >= totalDuration) {
    return [{ filename: filePath, range: { end: totalDuration, start: 0 } }];
  }

  const silences = await detectSilences(filePath, {
    silenceDuration,
    silenceThreshold,
  });
  console.log("silences", JSON.stringify(silences));

  const chunkRanges: TimeRange[] = mapSilenceResultsToChunkRanges(
    silences,
    chunkDuration,
    totalDuration
  ).filter((r) => r.end - r.start > chunkMinThreshold);

  logger.debug(chunkRanges, "chunkRanges");

  const chunks: AudioChunk[] = chunkRanges.map((range, index) => ({
    filename: path.format({
      dir: outputDir || parsedPath.dir,
      ext: parsedPath.ext,
      name: `${parsedPath.name}-chunk-${index.toString().padStart(3, "0")}`,
    }),
    range,
  }));

  if (chunks.length > 0) {
    if (callbacks?.onSplittingStarted) {
      await callbacks.onSplittingStarted(chunks.length);
    }

    await Promise.all(
      chunks.map((chunk, chunkIndex) => {
        return new Promise<void>((resolve, reject) => {
          const duration = chunk.range.end - chunk.range.start;

          let command = ffmpeg(filePath)
            .setStartTime(chunk.range.start)
            .setDuration(duration)
            .output(chunk.filename)
            .on("end", () => {
              if (callbacks?.onSplittingProgress) {
                callbacks.onSplittingProgress(chunk.filename, chunkIndex);
              }

              resolve();
            })
            .on("error", reject);

          // add some silence to prevent an error that happens for very short clips and normalize it to enhance sound volume for better transcription.
          command = command.audioFilters([
            `apad=pad_dur=${DEFAULT_SHORT_CLIP_PADDING}`,
            "loudnorm",
            "compand",
          ]);

          command.run();
        });
      })
    );

    if (callbacks?.onSplittingFinished) {
      await callbacks.onSplittingFinished();
    }
  }

  return chunks;
};
