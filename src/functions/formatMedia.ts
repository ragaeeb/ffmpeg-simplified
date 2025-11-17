import type { ReadStream } from "node:fs";
import os from "node:os";
import type {
	Logger,
	NoiseReductionOptions,
	PreprocessingCallbacks,
	PreprocessOptions,
} from "@/types";
import { runFFmpeg } from "@/vendor/ffmpeg";
import { NOISE_REDUCTION_OPTIONS_DEFAULTS } from "./constants";

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
			afftdnStop !== null && [
				`asendcmd=c='${afftdnStart} afftdn sn start'`,
				`asendcmd=c='${afftdnStop} afftdn sn stop'`,
			],
		afftdn_nf !== null && `afftdn=nf=${afftdn_nf}`,
		dialogueEnhance && "dialoguenhance",
		lowpass && `lowpass=f=${lowpass}`,
	]
		.flat()
		.filter(Boolean) as string[]; // Flatten and filter out undefined values

	return filters;
};

/**
 * Preprocesses a media file with options like noise reduction and format conversion.
 *
 * @param {ReadStream | string} input - Input stream or file path.
 * @param {string} outputPath - Destination path where the processed file will be written.
 * @param {PreprocessOptions} [options] - Optional preprocessing options.
 * @param {PreprocessingCallbacks} [callbacks] - Optional callbacks for progress tracking.
 * @param {Logger} [logger] - Optional logger for debug and error messages.
 * @returns {Promise<string>} - Promise resolving to the path of the processed media file.
 */
export const formatMedia = async (
	input: ReadStream | string,
	outputPath: string,
	options?: PreprocessOptions,
	callbacks?: PreprocessingCallbacks,
	logger?: Logger,
): Promise<string> => {
	logger?.debug?.(`formatMedia: ${input}, outputPath: ${outputPath}`);

	if (callbacks?.onPreprocessingStarted) {
		await callbacks.onPreprocessingStarted(outputPath);
	}

	const outputOptions: string[] = ["-ac", "1"]; // audio channels

	if (options?.noiseReduction !== null) {
		const filters = buildConversionFilters({
			...NOISE_REDUCTION_OPTIONS_DEFAULTS,
			...options?.noiseReduction,
		});
		logger?.debug?.(`Using filters: ${filters.join(", ")}`);
		if (filters.length > 0) {
			outputOptions.push("-af", filters.join(","));
		}
	}

	if (options?.fast) {
		const maxThreads = os.cpus().length;
		outputOptions.push("-threads", `${maxThreads}`);
		logger?.debug?.(`Using fast mode with ${maxThreads} threads`);
	}

	logger?.debug?.(`saveTo: ${outputPath}`);

	try {
		await runFFmpeg(
			{
				input,
				output: outputPath,
				outputOptions,
				overwriteExisting: true,
			},
			{
				onProgress: (progress) => {
					if (callbacks?.onPreprocessingProgress && progress.percent) {
						callbacks.onPreprocessingProgress(progress.percent);
					}
				},
				onDone: () => {
					logger?.debug?.(`Formatted file: ${outputPath}`);

					if (callbacks?.onPreprocessingFinished) {
						// Fire and forget - don't block on callback completion
						callbacks.onPreprocessingFinished(outputPath).catch((err) => {
							logger?.error?.(
								`Error in onPreprocessingFinished callback: ${err}`,
							);
						});
					}
				},
				onError: (err) => {
					logger?.error?.(`Error during file conversion: ${err.message}`);
				},
			},
		);

		return outputPath;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger?.error?.(`Failed to format media: ${message}`);
		throw error;
	}
};
