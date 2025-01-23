import ffmpeg from "fluent-ffmpeg";
import type { Readable } from "node:stream";
import type {
  NoiseReductionOptions,
  PreprocessingCallbacks,
  PreprocessOptions,
} from "../types";
import logger from "../utils/logger";
import { NOISE_REDUCTION_OPTIONS_DEFAULTS } from "./constants";
import os from "node:os";

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
        `asendcmd=${afftdnStart} afftdn sn start`,
        `asendcmd=${afftdnStop} afftdn sn stop`,
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
 * @param {Readable | string} input - Input stream or file path.
 * @param {string} outputDir - Directory where the processed file will be saved.
 * @param {PreprocessOptions} [options] - Optional preprocessing options.
 * @param {PreprocessingCallbacks} [callbacks] - Optional callbacks for progress tracking.
 * @returns {Promise<string>} - Promise resolving to the path of the processed media file.
 */
export const formatMedia = async (
  input: Readable | string,
  outputPath: string,
  options?: PreprocessOptions,
  callbacks?: PreprocessingCallbacks
): Promise<string> => {
  logger.debug(`formatMedia: ${input}, outputPath: ${outputPath}`);

  if (callbacks?.onPreprocessingStarted) {
    await callbacks.onPreprocessingStarted(outputPath);
  }

  return new Promise<string>((resolve, reject) => {
    let command = ffmpeg(input).audioChannels(1);

    if (options?.noiseReduction !== null) {
      const filters = buildConversionFilters({
        ...NOISE_REDUCTION_OPTIONS_DEFAULTS,
        ...options?.noiseReduction,
      });
      logger.debug(filters, "Using filters");
      command = command.audioFilters(filters);
    }

    if (options?.fast) {
      const maxThreads = os.cpus().length;
      command = command.outputOptions([`-threads ${maxThreads}`]);
      logger.debug(`Using fast mode with ${maxThreads} threads`);
    }

    logger.debug(`saveTo: ${outputPath}`);

    command
      .on("error", (err) => {
        logger.error(`Error during file conversion: ${err.message}`);
        reject(err);
      })
      .on("progress", (progress) => {
        if (callbacks?.onPreprocessingProgress) {
          callbacks.onPreprocessingProgress(progress.percent || 0);
        }
      })
      .on("end", async () => {
        logger.debug(`Formatted file: ${outputPath}`);

        if (callbacks?.onPreprocessingFinished) {
          await callbacks.onPreprocessingFinished(outputPath);
        }

        resolve(outputPath);
      })
      .save(outputPath);
  });
};
