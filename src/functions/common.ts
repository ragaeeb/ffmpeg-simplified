import ffmpeg from "fluent-ffmpeg";

export const getMediaDuration = async (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      resolve(metadata.format.duration || 0); // Return duration in seconds
    });
  });
};
