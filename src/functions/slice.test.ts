import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import { getMediaDuration } from "./getMediaDuration";

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

  it("should replace audio in the video file and resolve with the output file", async () => {
    const result = await slice(process.env.SAMPLE_MP4_FILE as string, {
      ranges: [
        { start: 0, end: 4 },
        { start: 6, end: 8 },
      ],
      outputFolder,
    });

    expect(result).toEqual([
      path.join(outputFolder, "sample_1.mp4"),
      path.join(outputFolder, "sample_2.mp4"),
    ]);

    expect(await getMediaDuration(result[0])).toBeCloseTo(4.008, 3);
    expect(await getMediaDuration(result[1])).toBeCloseTo(2.008, 3);
  });
});
