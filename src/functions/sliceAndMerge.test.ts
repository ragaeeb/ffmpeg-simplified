import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import { createTempDir } from "../utils/io";
import { sliceAndMerge } from "./sliceAndMerge";
import path from "node:path";
import { getMediaDuration } from "./getMediaDuration";

describe("sliceAndMerge", () => {
  let outputFolder: string;

  beforeEach(async () => {
    outputFolder = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(outputFolder, { recursive: true });
  });

  it("should slice the video into 2 chunks then merge the chunks together back to 1 video using time codes", async () => {
    const result = await sliceAndMerge(
      process.env.SAMPLE_MP4_FILE as string,
      path.join(outputFolder, "slicedAndMerged.mp4"),
      {
        ranges: ["0-0:04", "0:06-0:08"],
      }
    );

    expect(await getMediaDuration(result)).toBeCloseTo(5.99, 2);
  });
});
