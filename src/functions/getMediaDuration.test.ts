import { describe, expect, it } from "vitest";

import { getMediaDuration } from "./getMediaDuration";

describe("getMediaDuration", () => {
  it("should detect the duration of the media", async () => {
    const result = await getMediaDuration(
      process.env.SAMPLE_MP3_FILE as string
    );
    expect(result).toBeCloseTo(33.5935, 3);
  });
});
