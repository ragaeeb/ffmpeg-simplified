import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { mergeSlices } from "./merge";
import { slice } from "./slice";
import { createTempDir } from "../utils/io";
import { promises as fs } from "node:fs";
import { getMediaDuration } from "./getMediaDuration";
import path from "node:path";

describe("merge", () => {
  let outputFolder: string;

  beforeEach(async () => {
    outputFolder = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(outputFolder, { recursive: true });
  });

  it("should merge the slices", async () => {
    const chunks = await slice(process.env.SAMPLE_MP4_FILE as string, {
      ranges: [
        { start: 0, end: 4 },
        { start: 6, end: 8 },
      ],
      outputFolder,
    });

    const mergedFile = path.join(outputFolder, "merged.mp4");

    const result = await mergeSlices(chunks, mergedFile);
    expect(result).toEqual(mergedFile);

    expect(await getMediaDuration(result)).toBeCloseTo(6, 1);
  });
});
