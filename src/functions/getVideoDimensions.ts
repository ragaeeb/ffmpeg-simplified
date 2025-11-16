import ffmpeg from "../vendor/ffmpegy";

/**
 * Retrieves the pixel width and height of the first video stream in a media file.
 *
 * @param {string} videoFilePath - Absolute or relative path to the media file to inspect.
 * @returns {Promise<[number, number]>} Promise resolving with a tuple containing the width and height in pixels.
 */
export const getVideoDimensions = (
  videoFilePath: string
): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video"
      );

      if (!videoStream || !videoStream.width || !videoStream.height) {
        const error = new Error("Could not determine video dimensions.");
        return reject(error);
      }

      resolve([videoStream.width, videoStream.height]);
    });
  });
};
