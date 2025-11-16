import { describe, expect, it } from "bun:test";

import { detectSilences, mapOutputToSilenceResults } from "./detectSilences";

describe("detectSilences", () => {
  describe("mapOutputToSilenceResults", () => {
    it("returns empty array if no lines", () => {
      expect(mapOutputToSilenceResults([])).toEqual([]);
    });

    it("handles floating-point values", () => {
      const lines = ["ghi", "silence_start: 3.5", "silence_end: 4.75", "xyz"];
      expect(mapOutputToSilenceResults(lines)).toEqual([
        { start: 3.5, end: 4.75 },
      ]);
    });

    it("handles integer values", () => {
      const lines = ["silence_start: 10", "silence_end: 12"];
      expect(mapOutputToSilenceResults(lines)).toEqual([
        { start: 10, end: 12 },
      ]);
    });

    it("ignores silence_end without preceding start", () => {
      const lines = ["silence_end: 5"];
      expect(mapOutputToSilenceResults(lines)).toEqual([]);
    });

    it("ignores silence_start without following end", () => {
      const lines = ["foo", "silence_start: 2.2", "bar"];
      expect(mapOutputToSilenceResults(lines)).toEqual([]);
    });

    it("ignores invalid number formats", () => {
      const lines = ["silence_start: foo", "silence_end: bar"];
      expect(mapOutputToSilenceResults(lines)).toEqual([]);
    });

    it("ignores intervals where end <= start", () => {
      expect(
        mapOutputToSilenceResults(["silence_start: 5", "silence_end: 5"])
      ).toEqual([]);
      expect(
        mapOutputToSilenceResults(["silence_start: 6", "silence_end: 5"])
      ).toEqual([]);
    });

    it("handles multiple silence intervals in sequence", () => {
      const lines = [
        "silence_start: 1",
        "silence_end: 2",
        "silence_start: 3.3",
        "silence_end: 4.4",
      ];
      expect(mapOutputToSilenceResults(lines)).toEqual([
        { start: 1, end: 2 },
        { start: 3.3, end: 4.4 },
      ]);
    });

    it("overrides previous start if a new one appears before end", () => {
      const lines = ["silence_start: 1", "silence_start: 2", "silence_end: 3"];
      // only the second start counts
      expect(mapOutputToSilenceResults(lines)).toEqual([{ start: 2, end: 3 }]);
    });
  });

  it("should detect silences for -35dB for 0.2s", async () => {
    const result = await detectSilences(process.env.SAMPLE_WAV_FILE as string, {
      silenceDuration: 0.2,
      silenceThreshold: -35,
    });

    const expected = [
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
    ];

    expect(result).toHaveLength(expected.length);
    expected.forEach((range, index) => {
      const current = result[index];
      expect(current.start).toBeCloseTo(range.start, 3);
      expect(current.end).toBeCloseTo(range.end, 3);
    });
  });

  it("should detect silences for -35dB for 0.2s for the mp3", async () => {
    const result = await detectSilences(process.env.SAMPLE_MP3_FILE as string, {
      silenceDuration: 0.2,
      silenceThreshold: -35,
    });
    expect(result).toHaveLength(1);
    expect(result[0].start).toBeCloseTo(0, 3);
    expect(result[0].end).toBeCloseTo(0.702177, 3);
  });
});
