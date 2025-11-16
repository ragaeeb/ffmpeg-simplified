import {
  describe,
  expect,
  it,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "bun:test";
import { createTempDir } from "../utils/io";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getFrames } from "./getFrames";
import { CropPreset, FramePreprocessingPreset } from "../types";
import { getVideoDimensions } from "./getVideoDimensions";

describe("getFrames", () => {
  let outputFolder: string;

  beforeAll(async () => {
    outputFolder = await createTempDir();
  });

  afterAll(async () => {
    await fs.rm(outputFolder, { recursive: true });
  });

  it("should output the frames", async () => {
    const result = await getFrames(process.env.SAMPLE_MP4_FILE as string, {
      outputFolder,
      frequency: 5,
      preprocessingOptions: FramePreprocessingPreset.DarkTextOnLightBackground,
      cropOptions: CropPreset.VerticallyCenteredText,
    });

    expect(result).toEqual([
      { filename: path.join(outputFolder, "frame_0000.jpg"), start: 0 },
      { filename: path.join(outputFolder, "frame_0001.jpg"), start: 5 },
    ]);

    expect(await getVideoDimensions(result[0].filename)).toEqual([320, 108]);
    expect(await getVideoDimensions(result[1].filename)).toEqual([320, 108]);
  });
});
