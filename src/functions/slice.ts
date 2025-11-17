import os from "node:os";
import path from "node:path";
import type { Logger, SliceOptions } from "@/types";
import { runFFmpeg } from "@/vendor/ffmpeg";

/**
 * Slices a media file into multiple parts based on specified time ranges.
 *
 * @param {string} file - Path to the input media file.
 * @param {SliceOptions} options - Options containing the time ranges and output folder.
 * @param {Logger} [logger] - Optional logger for debug and info messages.
 * @returns {Promise<string[]>} - Promise resolving to an array of paths to the sliced files.
 */
export const slice = async (
	file: string,
	options: SliceOptions,
	logger?: Logger,
): Promise<string[]> => {
	const outputFiles: string[] = [];
	const fileName = path.basename(file, path.extname(file));
	const fileExtension = path.extname(file);

	const threads = options.fast ? os.cpus().length : 0;

	for (let i = 0; i < options.ranges.length; i++) {
		const { start, end } = options.ranges[i];

		if (end <= start) {
			throw new Error(
				`Invalid slice range: end (${end}) must be greater than start (${start})`,
			);
		}

		const outputFile = path.join(
			options.outputFolder,
			`${fileName}_${i + 1}${fileExtension}`,
		);

		const outputOptions: string[] = [];

		if (options.fast && threads) {
			outputOptions.push("-threads", `${threads}`);

			if (logger?.debug) {
				logger.debug(`Using fast mode with ${threads} threads for slicing`);
			}
		}

		outputOptions.push("-t", `${end - start}`);

		await runFFmpeg(
			{
				input: file,
				inputOptions: ["-ss", `${start}`],
				output: outputFile,
				outputOptions,
				overwriteExisting: true,
			},
			{
				onDone: () => {
					logger?.info?.(`Sliced video saved as ${outputFile}`);
				},
			},
		);

		outputFiles.push(outputFile);
	}

	return outputFiles;
};
