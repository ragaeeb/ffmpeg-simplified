import { describe, expect, it } from "vitest";

import { getMediaDuration } from "./common";

describe("getMediaDuration", () => {
  it(
    "should detect the duration of the media",
    async () => {
      const result = await getMediaDuration(
        "https://d38nvwmjovqyq6.cloudfront.net/va90web25003/companions/ws_smith/18%20Double%20Consonants.mp3"
      );
      expect(result).toBeCloseTo(22.256, 3);
    },
    { timeout: 30000 }
  );
});
