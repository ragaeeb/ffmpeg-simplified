import { randomUUID } from "node:crypto";
import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import type { Readable } from "node:stream";
import type {
  NoiseReductionOptions,
  PreprocessingCallbacks,
  PreprocessOptions,
} from "../types";
import logger from "../utils/logger";
import { NOISE_REDUCTION_OPTIONS_DEFAULTS } from "./constants";

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

export const formatMedia = async (
  input: Readable | string,
  outputDir: string,
  options?: PreprocessOptions,
  callbacks?: PreprocessingCallbacks
): Promise<string> => {
  const outputPath = path.join(outputDir, `${randomUUID()}.mp3`);
  logger.debug(
    `formatMedia: ${input}, outputDir: ${outputDir}, outputPath: ${outputPath}`
  );

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
        logger.info(`Formatted file: ${outputPath}`);

        if (callbacks?.onPreprocessingFinished) {
          await callbacks.onPreprocessingFinished(outputPath);
        }

        resolve(outputPath);
      })
      .save(outputPath);
  });
};
