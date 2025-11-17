import path from 'node:path';
import deepmerge from 'deepmerge';
import type { AudioChunk, Logger, SplitOnSilenceCallbacks, SplitOptions, TimeRange } from '@/types';
import { FFmpeggy } from '@/vendor/ffmpeggy';
import { DEFAULT_SHORT_CLIP_PADDING, SPLIT_OPTIONS_DEFAULTS } from './constants';
import { detectSilences } from './detectSilences';
import { getMediaDuration } from './getMediaDuration';

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
    totalDuration: number,
): TimeRange[] => {
    if (chunkDuration <= 0) {
        throw new Error('chunkDuration must be greater than 0');
    }

    if (chunkDuration >= totalDuration) {
        return [{ end: totalDuration, start: 0 }];
    }

    const chunks: TimeRange[] = [];
    let currentStart = 0;

    const isFullySilent = (start: number, end: number) => silenceResults.some((s) => start >= s.start && end <= s.end);

    while (currentStart < totalDuration) {
        const chunkEnd = Math.min(currentStart + chunkDuration, totalDuration);

        const relevantSilences = silenceResults
            .filter((s) => s.start > currentStart && s.start <= chunkEnd)
            .sort((a, b) => b.start - a.start);

        const segStart = currentStart;
        let segEnd: number;

        if (relevantSilences.length > 0) {
            segEnd = relevantSilences[0].start;
            currentStart = relevantSilences[0].start;
        } else {
            segEnd = chunkEnd;
            currentStart = chunkEnd;
        }

        if (segEnd > segStart && !isFullySilent(segStart, segEnd)) {
            chunks.push({ end: segEnd, start: segStart });
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
 * @param {Logger} [logger] - Optional logger for debug and info messages.
 * @returns {Promise<AudioChunk[]>} - Promise resolving to an array of audio chunks with file names and time ranges.
 */
export const splitFileOnSilences = async (
    filePath: string,
    outputDir: string,
    options?: SplitOptions,
    callbacks?: SplitOnSilenceCallbacks,
    logger?: Logger,
): Promise<AudioChunk[]> => {
    const parsedPath = path.parse(filePath);

    logger?.debug?.(`Split file ${filePath}`);

    const {
        chunkDuration,
        chunkMinThreshold,
        silenceDetection: { silenceDuration, silenceThreshold },
    } = deepmerge(SPLIT_OPTIONS_DEFAULTS, options || {});

    logger?.info?.(
        `Using chunkDuration=${chunkDuration}, chunkMinThreshold=${chunkMinThreshold}, silenceThreshold=${silenceThreshold}, silenceDuration=${silenceDuration}`,
    );

    const totalDuration = await getMediaDuration(filePath);

    if (chunkDuration >= totalDuration) {
        return [{ filename: filePath, range: { end: totalDuration, start: 0 } }];
    }

    const silences = await detectSilences(filePath, {
        silenceDuration,
        silenceThreshold,
    });

    const chunkRanges: TimeRange[] = mapSilenceResultsToChunkRanges(silences, chunkDuration, totalDuration).filter(
        (r) => r.end - r.start > chunkMinThreshold,
    );

    const chunks: AudioChunk[] = chunkRanges.map((range, index) => ({
        filename: path.format({
            dir: outputDir || parsedPath.dir,
            ext: parsedPath.ext,
            name: `${parsedPath.name}-chunk-${index.toString().padStart(3, '0')}`,
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

                    const ffmpeggy = new FFmpeggy({
                        autorun: true,
                        input: filePath,
                        inputOptions: [`-ss ${chunk.range.start}`],
                        output: chunk.filename,
                        outputOptions: [
                            `-t ${duration}`,
                            `-af apad=pad_dur=${DEFAULT_SHORT_CLIP_PADDING},loudnorm,compand`,
                        ],
                        overwriteExisting: true,
                    });

                    ffmpeggy.on('done', () => {
                        if (callbacks?.onSplittingProgress) {
                            callbacks.onSplittingProgress(chunk.filename, chunkIndex);
                        }
                        resolve();
                    });

                    ffmpeggy.on('error', reject);
                });
            }),
        );

        if (callbacks?.onSplittingFinished) {
            await callbacks.onSplittingFinished();
        }
    }

    return chunks;
};
