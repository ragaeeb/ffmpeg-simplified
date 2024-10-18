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
import { getMediaDuration } from "./common";
import { detectSilences } from "./detectSilences";

export const mapSilenceResultsToChunkRanges = (
  silenceResults: TimeRange[],
  chunkDuration: number,
  totalDuration: number
): TimeRange[] => {
  if (chunkDuration >= totalDuration) {
    return [{ end: totalDuration, start: 0 }];
  }

  const chunks: TimeRange[] = [];
  let currentStart = 0;

  while (currentStart < totalDuration) {
    const chunkEnd = Math.min(currentStart + chunkDuration, totalDuration);
    const relevantSilences = silenceResults
      .filter((s) => s.start > currentStart && s.start <= chunkEnd)
      .sort((a, b) => b.start - a.start);

    if (relevantSilences.length > 0) {
      const lastSilenceInChunk = relevantSilences[0];
      chunks.push({ end: lastSilenceInChunk.start, start: currentStart });
      currentStart = lastSilenceInChunk.start;
    } else {
      chunks.push({ end: chunkEnd, start: currentStart });
      currentStart = chunkEnd;
    }
  }

  return chunks;
};

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
