import { replaceAudio } from "./replaceAudio";
import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";
import { promises as fs } from "node:fs";

import { createTempDir } from "../utils/io";
import { getMediaDuration } from "./getMediaDuration";
import path from "node:path";

describe("replaceAudio", () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true });
  });

  it("should replace audio in the video file and resolve with the output file", async () => {
    const outputFile = path.join(outputDir, "audio_replaced.mp4");
    const newAudio = process.env.SAMPLE_MP3_FILE as string;

    const result = await replaceAudio(
      process.env.SAMPLE_MP4_FILE as string,
      newAudio,
      outputFile
    );

    expect(result).toEqual(outputFile);

    const [audioDuration, outputDuration] = await Promise.all([
      getMediaDuration(newAudio),
      getMediaDuration(result),
    ]);
    expect(outputDuration).toBeCloseTo(audioDuration, 1);
  });
});
