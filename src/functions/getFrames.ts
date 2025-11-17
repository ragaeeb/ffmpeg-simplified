import path from "node:path";
import type { Frame, GetFramesOptions, Logger } from "@/types";
import { mapCropOptionsToCropFilter } from "@/utils/cropping";
import {
	collectFramePaths,
	mapFramePreprocessingToFilter,
} from "@/utils/framePreprocessing";
import { runFFmpeg } from "@/vendor/ffmpeg";
import { getVideoDimensions } from "./getVideoDimensions";

/**
 * Extracts still frames from a video file and writes them to disk according to the provided options.
 *
 * @param {string} videoFile - Path to the input video file.
 * @param {GetFramesOptions} options - Extraction options including output folder, frequency and preprocessing choices.
 * @param {Logger} [logger] - Optional logger for info and error messages.
 * @returns {Promise<Frame[]>} Promise resolving with ordered frame descriptors for the generated images.
 */
export const getFrames = async (
	videoFile: string,
	options: GetFramesOptions,
	logger?: Logger,
): Promise<Frame[]> => {
	const [width, height] = await getVideoDimensions(videoFile);
	const { fileExtension = ".jpg", filePrefix = "frame_" } = options;

	const filters = [
		`fps=1/${options.frequency}`,
		options.cropOptions &&
			mapCropOptionsToCropFilter(width, height, options.cropOptions),
		options.preprocessingOptions &&
			mapFramePreprocessingToFilter(options.preprocessingOptions),
	].filter(Boolean) as string[];

	const outputPattern = path.join(
		options.outputFolder,
		`${filePrefix}%04d${fileExtension}`,
	);

	try {
		await runFFmpeg({
			input: videoFile,
			output: outputPattern,
			outputOptions: ["-vf", filters.join(","), "-vsync", "vfr", "-start_number", "0"],
		});

		logger?.info?.("Frame extraction completed.");

		// Brief delay to ensure all files are flushed to disk
		await new Promise((resolve) => setTimeout(resolve, 100));

		const framePaths = await collectFramePaths(
			options.outputFolder,
			filePrefix,
			fileExtension,
			options.frequency,
		);

		return framePaths;
	} catch (err) {
		const error = err as Error;
		logger?.error?.(`Error during frame extraction: ${error.message}`);
		throw err;
	}
};
