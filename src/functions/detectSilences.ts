import type { SilenceDetectionOptions, TimeRange } from "../types";
import ffmpeg from "fluent-ffmpeg";

const mapOutputToSilenceResults = (silenceLines: string[]): TimeRange[] => {
  const silences: TimeRange[] = [];
  let currentSilenceStart: null | number = null;

  for (const line of silenceLines) {
    if (line.includes("silence_start")) {
      currentSilenceStart = Number.parseFloat(
        line.match(/silence_start: (\d+\.\d+)/)?.[1] || "0"
      );
    } else if (line.includes("silence_end") && currentSilenceStart !== null) {
      const silenceEnd = Number.parseFloat(
        line.match(/silence_end: (\d+\.\d+)/)?.[1] || "0"
      );
      silences.push({ end: silenceEnd, start: currentSilenceStart });
      currentSilenceStart = null; // Reset for the next detection
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
