import type { Logger } from "@/types";
import { runFFmpeg } from "@/vendor/ffmpeg";

/**
 * Replaces the audio track of a video file with a new audio file.
 *
 * @param {string} videoFile - Path to the input video file.
 * @param {string} audioFile - Path to the new audio file.
 * @param {string} outputFile - Path where the output video will be saved.
 * @param {Logger} [logger] - Optional logger for info messages.
 * @returns {Promise<string>} - Promise resolving to the path of the output video file.
 */
export const replaceAudio = async (
	videoFile: string,
	audioFile: string,
	outputFile: string,
	logger?: Logger,
): Promise<string> => {
	logger?.info?.(`Replacing audio in ${videoFile} with ${audioFile}`);

	await runFFmpeg({
		input: [videoFile, audioFile],
		output: outputFile,
		outputOptions: ["-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0"],
		overwriteExisting: true,
	});

	return outputFile;
};
