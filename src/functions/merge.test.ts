import {
  describe,
  expect,
  afterAll,
  it,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

import { mergeSlices } from "./merge";
import { slice } from "./slice";
import { createTempDir } from "../utils/io";
import { promises as fs } from "node:fs";
import { getMediaDuration } from "./getMediaDuration";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";

describe("merge", () => {
  let outputFolder: string;

  beforeEach(async () => {
    outputFolder = await createTempDir();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await fs.rm(outputFolder, { recursive: true });
  });

  it("should merge the slices", async () => {
    const mockOutputOptions = vi.spyOn(ffmpeg.prototype, "outputOptions");
    const chunks = await slice(process.env.SAMPLE_MP4_FILE as string, {
      ranges: [
        { start: 0, end: 4 },
        { start: 6, end: 8 },
      ],
      outputFolder,
      fast: true,
    });

    const mergedFile = path.join(outputFolder, "merged.mp4");

    const result = await mergeSlices(chunks, mergedFile);
    expect(result).toEqual(mergedFile);

    expect(await getMediaDuration(result)).toBeCloseTo(6, 1);

    expect(mockOutputOptions).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([expect.stringMatching(/-threads \d+/)])
    );
  });
});
