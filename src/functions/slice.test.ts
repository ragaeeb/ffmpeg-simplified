import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import { getMediaDuration } from "./common";

import { createTempDir } from "../utils/io";
import { slice } from "./slice";
import path from "node:path";

describe("slice", () => {
  let outputFolder: string;

  beforeEach(async () => {
    outputFolder = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(outputFolder, { recursive: true });
  });

  it(
    "should replace audio in the video file and resolve with the output file",
    async () => {
      const result = await slice(
        "https://www.sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4",
        {
          ranges: [
            [0, 4],
            [6, 8],
          ],
          outputFolder,
        }
      );

      expect(result).toEqual([
        path.join(outputFolder, "big_buck_bunny_240p_1mb_1.mp4"),
        path.join(outputFolder, "big_buck_bunny_240p_1mb_2.mp4"),
      ]);

      expect(await getMediaDuration(result[0])).toBeCloseTo(4, 3);
      expect(await getMediaDuration(result[1])).toBeCloseTo(2, 3);
    },
    { timeout: 60000 }
  );
});
