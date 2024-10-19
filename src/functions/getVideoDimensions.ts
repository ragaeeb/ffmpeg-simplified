import ffmpeg from "fluent-ffmpeg";

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
