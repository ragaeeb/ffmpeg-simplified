import type { SilenceDetectionOptions, TimeRange } from "../types";
import ffmpeg from "fluent-ffmpeg";

/**
 * Parses ffmpeg silencedetect output lines into TimeRange objects.
 * Supports both integer and floating-point values, and skips invalid or degenerate intervals.
 */
export const mapOutputToSilenceResults = (
  silenceLines: string[]
): TimeRange[] => {
  const silences: TimeRange[] = [];
  let currentSilenceStart: number | null = null;

  for (const line of silenceLines) {
    if (line.includes("silence_start")) {
      const match = line.match(/silence_start: (\d+(?:\.\d+)?)/);
      if (match) {
        const parsed = parseFloat(match[1]);
        currentSilenceStart = !isNaN(parsed) ? parsed : null;
      } else {
        currentSilenceStart = null;
      }
    } else if (line.includes("silence_end") && currentSilenceStart !== null) {
      const match = line.match(/silence_end: (\d+(?:\.\d+)?)/);
      if (match) {
        const silenceEnd = parseFloat(match[1]);
        // only add if valid and end > start
        if (!isNaN(silenceEnd) && silenceEnd > currentSilenceStart) {
          silences.push({ start: currentSilenceStart, end: silenceEnd });
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
export const detectSilences = (
  filePath: string,
  { silenceDuration, silenceThreshold }: SilenceDetectionOptions
): Promise<TimeRange[]> => {
  return new Promise<TimeRange[]>((resolve, reject) => {
    const silenceLines: string[] = [];

    ffmpeg(filePath)
      .outputOptions([
        `-af silencedetect=n=${silenceThreshold}dB:d=${silenceDuration}`,
        "-f null",
      ])
      .output("NUL") // Use '/dev/null' on Unix or 'NUL' on Windows
      .on("stderr", (stderrLine: string) => {
        silenceLines.push(stderrLine);
      })
      .on("end", () => {
        const silences = mapOutputToSilenceResults(silenceLines);
        resolve(silences);
      })
      .on("error", (err) => {
        reject(err);
      })
      .run();
  });
};
