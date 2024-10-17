import { replaceAudio } from "./replaceAudio";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";

import { createTempDir } from "../utils/io";
import { getMediaDuration } from "./common";
import path from "node:path";

describe("replaceAudio", () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true });
  });

  it(
    "should replace audio in the video file and resolve with the output file",
    async () => {
      const outputFile = path.join(outputDir, "audio_replaced.mp4");
      const newAudio =
        "https://d38nvwmjovqyq6.cloudfront.net/va90web25003/companions/ws_smith/18%20Double%20Consonants.mp3";

      const result = await replaceAudio(
        "https://www.sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4",
        newAudio,
        outputFile
      );

      expect(result).toEqual(outputFile);

      const [audioDuration, outputDuration] = await Promise.all([
        getMediaDuration(newAudio),
        getMediaDuration(result),
      ]);
      expect(outputDuration).toBeCloseTo(audioDuration, 3);
    },
    { timeout: 60000 }
  );
});
