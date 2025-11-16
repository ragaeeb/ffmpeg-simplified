import ffmpeg from "../vendor/ffmpegy";
import logger from "../utils/logger";

/**
 * Replaces the audio track of a video file with a new audio file.
 *
 * @param {string} videoFile - Path to the input video file.
 * @param {string} audioFile - Path to the new audio file.
 * @param {string} outputFile - Path where the output video will be saved.
 * @returns {Promise<string>} - Promise resolving to the path of the output video file.
 */
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
