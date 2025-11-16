import ffmpeg from "../vendor/ffmpegy";

/**
 * Retrieves the duration of a media file in seconds.
 *
 * @param {string} filePath - Path to the media file.
 * @returns {Promise<number>} - Promise resolving to the duration of the media file in seconds.
 */
export const getMediaDuration = async (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const rawDuration = metadata.format.duration ?? 0;
      const parsed =
        typeof rawDuration === "number"
          ? rawDuration
          : parseFloat(String(rawDuration));

      resolve(Number.isFinite(parsed) ? parsed : 0);
    });
  });
};
