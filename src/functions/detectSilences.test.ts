import { describe, expect, it } from "vitest";

import { detectSilences } from "./detectSilences";

describe("detectSilences", () => {
  it("should detect silences for -35dB for 0.2s", async () => {
    const result = await detectSilences(
      "https://github.com/ragaeeb/tafrigh/raw/577b870b887b09f806ca3dba67019950981970a5/testing/khutbah.wav",
      {
        silenceDuration: 0.2,
        silenceThreshold: -35,
      }
    );
    expect(result).toEqual([
      { end: 0.917551, start: 0 },
      { end: 1.50263, start: 1.258957 },
      { end: 8.355329, start: 7.343764 },
      { end: 14.872517, start: 14.573605 },
      { end: 15.507075, start: 14.872562 },
      { end: 18.541905, start: 18.28966 },
      { end: 19.119955, start: 18.591066 },
      { end: 24.123311, start: 23.876961 },
      { end: 24.571837, start: 24.311701 },
      { end: 27.952517, start: 27.561224 },
      { end: 28.43356, start: 28.062132 },
      { end: 33.384943, start: 33.169569 },
    ]);
  });

  it("should detect silences for -35dB for 0.2s for the mp3", async () => {
    const result = await detectSilences(
      "https://media.githubusercontent.com/media/ragaeeb/tafrigh/577b870b887b09f806ca3dba67019950981970a5/testing/khutbah.mp3",
      {
        silenceDuration: 0.2,
        silenceThreshold: -35,
      }
    );
    expect(result).toEqual([{ end: 0.702177, start: 0 }]);
  });
});
