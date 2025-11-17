import { describe, expect, it } from "bun:test";

import { getVideoDimensions } from "./getVideoDimensions";

describe("getVideoDimensions", () => {
  it("should detect the width and height", async () => {
    const result = await getVideoDimensions(
      process.env.SAMPLE_MP4_FILE as string
    );
    expect(result).toEqual([320, 180]);
  });
});
