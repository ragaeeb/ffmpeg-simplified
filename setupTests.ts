import path from "node:path";

export const setup = async () => {
  process.env.SAMPLE_WAV_FILE = path.join("testing", "sample.wav");
  process.env.SAMPLE_MP3_FILE = path.join("testing", "sample.mp3");
  process.env.SAMPLE_MP4_FILE = path.join("testing", "sample.mp4");
};
