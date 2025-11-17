import os from 'node:os';
import type { Readable } from 'node:stream';
import type { Logger, NoiseReductionOptions, PreprocessingCallbacks, PreprocessOptions } from '@/types';
import { FFmpeggy } from '@/vendor/ffmpeggy';
import { NOISE_REDUCTION_OPTIONS_DEFAULTS } from './constants';

/**
 * Maps the provided noise reduction configuration into ffmpeg audio filter expressions.
 *
 * @param {NoiseReductionOptions} options - Noise reduction tuning values.
 * @returns {string[]} ffmpeg audio filter definitions.
 */
const buildConversionFilters = ({
    afftdn_nf,
    afftdnStart,
    afftdnStop,
    dialogueEnhance,
    highpass,
    lowpass,
}: NoiseReductionOptions): string[] => {
    const filters = [
        highpass !== null && `highpass=f=${highpass}`,
        afftdnStart !== null &&
            afftdnStop !== null && [`asendcmd=${afftdnStart} afftdn sn start`, `asendcmd=${afftdnStop} afftdn sn stop`],
        afftdn_nf !== null && `afftdn=nf=${afftdn_nf}`,
        dialogueEnhance && 'dialoguenhance',
        lowpass && `lowpass=f=${lowpass}`,
    ]
        .flat()
        .filter(Boolean) as string[]; // Flatten and filter out undefined values

    return filters;
};

/**
 * Preprocesses a media file with options like noise reduction and format conversion.
 *
 * @param {Readable | string} input - Input stream or file path.
 * @param {string} outputPath - Destination path where the processed file will be written.
 * @param {PreprocessOptions} [options] - Optional preprocessing options.
 * @param {PreprocessingCallbacks} [callbacks] - Optional callbacks for progress tracking.
 * @param {Logger} [logger] - Optional logger for debug and error messages.
 * @returns {Promise<string>} - Promise resolving to the path of the processed media file.
 */
export const formatMedia = async (
    input: Readable | string,
    outputPath: string,
    options?: PreprocessOptions,
    callbacks?: PreprocessingCallbacks,
    logger?: Logger,
): Promise<string> => {
    logger?.debug?.(`formatMedia: ${input}, outputPath: ${outputPath}`);

    if (callbacks?.onPreprocessingStarted) {
        await callbacks.onPreprocessingStarted(outputPath);
    }

    return new Promise<string>((resolve, reject) => {
        const outputOptions: string[] = ['-ac 1']; // audio channels

        if (options?.noiseReduction !== null) {
            const filters = buildConversionFilters({
                ...NOISE_REDUCTION_OPTIONS_DEFAULTS,
                ...options?.noiseReduction,
            });
            logger?.debug?.(`Using filters: ${filters.join(', ')}`);
            if (filters.length > 0) {
                outputOptions.push(`-af ${filters.join(',')}`);
            }
        }

        if (options?.fast) {
            const maxThreads = os.cpus().length;
            outputOptions.push(`-threads ${maxThreads}`);
            logger?.debug?.(`Using fast mode with ${maxThreads} threads`);
        }

        logger?.debug?.(`saveTo: ${outputPath}`);

        const ffmpeggy = new FFmpeggy({
            autorun: true,
            input,
            output: outputPath,
            outputOptions,
            overwriteExisting: true,
        });

        ffmpeggy
            .on('error', (err) => {
                logger?.error?.(`Error during file conversion: ${err.message}`);
                reject(err);
            })
            .on('progress', (progress) => {
                if (callbacks?.onPreprocessingProgress && progress.percent) {
                    callbacks.onPreprocessingProgress(progress.percent);
                }
            })
            .on('done', async () => {
                logger?.debug?.(`Formatted file: ${outputPath}`);

                if (callbacks?.onPreprocessingFinished) {
                    await callbacks.onPreprocessingFinished(outputPath);
                }

                resolve(outputPath);
            });
    });
};
