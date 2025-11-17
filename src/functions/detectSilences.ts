import os from "node:os";
import type { SilenceDetectionOptions, TimeRange } from "@/types";
import { runFFmpeg } from "@/vendor/ffmpeg";

/**
 * Parses ffmpeg silencedetect output lines into {@link TimeRange} objects.
 * Supports both integer and floating-point values, and skips invalid or degenerate intervals.
 *
 * @param {string[]} silenceLines - Raw stderr lines emitted by ffmpeg's silencedetect filter.
 * @returns {TimeRange[]} Normalised silence intervals sorted by appearance order.
 */
export const mapOutputToSilenceResults = (
	silenceLines: string[],
): TimeRange[] => {
	const silences: TimeRange[] = [];
	let currentSilenceStart: number | null = null;

	for (const line of silenceLines) {
		if (line.includes("silence_start")) {
			const match = line.match(/silence_start: (\d+(?:\.\d+)?)/);
			if (match) {
				const parsed = Number.parseFloat(match[1]);
				currentSilenceStart = !Number.isNaN(parsed) ? parsed : null;
			} else {
				currentSilenceStart = null;
			}
		} else if (line.includes("silence_end") && currentSilenceStart !== null) {
			const match = line.match(/silence_end: (\d+(?:\.\d+)?)/);
			if (match) {
				const silenceEnd = Number.parseFloat(match[1]);
				// only add if valid and end > start
				if (!Number.isNaN(silenceEnd) && silenceEnd > currentSilenceStart) {
					silences.push({ end: silenceEnd, start: currentSilenceStart });
				}
			}
			currentSilenceStart = null;
		}
	}

	return silences;
};

/**
 * Detects silences in an audio file based on specified threshold and duration.
 *
 * @param {string} filePath - Path to the input audio file.
 * @param {SilenceDetectionOptions} options - Options for silence detection.
 * @returns {Promise<TimeRange[]>} - Promise resolving to an array of time ranges where silence was detected.
 */
export const detectSilences = async (
	filePath: string,
	{ silenceDuration, silenceThreshold }: SilenceDetectionOptions,
): Promise<TimeRange[]> => {
	const silenceLines: string[] = [];
	const nullSink = os.platform() === "win32" ? "NUL" : "/dev/null";

	await runFFmpeg(
		{
			input: filePath,
			output: nullSink,
			outputOptions: [
				"-af",
				`silencedetect=n=${silenceThreshold}dB:d=${silenceDuration}`,
				"-f",
				"null",
			],
		},
		{
			onStderr: (data) => {
				const lines = data.split("\n");
				silenceLines.push(...lines);
			},
		},
	);

	return mapOutputToSilenceResults(silenceLines);
};
