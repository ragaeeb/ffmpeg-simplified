import ffmpeg from "fluent-ffmpeg";
import logger from "../utils/logger";

export const replaceAudio = async (
  videoFile: string,
  audioFile: string,
  outputFile: string
): Promise<string> => {
  logger.info(`Replacing audio in ${videoFile} with ${audioFile}`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .input(audioFile)
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-strict experimental",
        "-map 0:v:0",
        "-map 1:a:0",
      ])
      .on("end", () => {
        resolve(outputFile);
      })
      .on("error", (err) => reject(err))
      .save(outputFile);
  });
};
