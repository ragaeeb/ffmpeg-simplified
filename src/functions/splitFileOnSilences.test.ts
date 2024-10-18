import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import ffmpeg from "fluent-ffmpeg";

import type { TimeRange } from "../types";
import {
  mapSilenceResultsToChunkRanges,
  splitFileOnSilences,
} from "./splitFileOnSilences";
import { getMediaDuration } from "./common";
import { createTempDir } from "../utils/io";

describe("splitOnSilence", () => {
  describe("mapSilenceResultsToChunkRanges", () => {
    it("should map silences to correct chunk ranges for a single chunk scenario", () => {
      const silenceResults: TimeRange[] = [];
      const chunkDuration = 10;
      const totalDuration = 10;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([{ end: 10, start: 0 }]);
    });

    it("should map silences to correct chunk ranges when there are multiple silences and chunks", () => {
      const silenceResults: TimeRange[] = [
        { end: 6.5, start: 6 },
        { end: 9, start: 8.5 },
        { end: 15.5, start: 15 },
        { end: 20.5, start: 20 },
      ];
      const chunkDuration = 10;
      const totalDuration = 30;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([
        { end: 8.5, start: 0 },
        { end: 15, start: 8.5 },
        { end: 20, start: 15 },
        { end: 30, start: 20 },
      ]);
    });

    it("should handle scenario where last chunk duration is less than chunkDuration", () => {
      const silenceResults: TimeRange[] = [
        { end: 6.5, start: 6 },
        { end: 9, start: 8.5 },
        { end: 15.5, start: 15 },
        { end: 20.5, start: 20 },
      ];
      const chunkDuration = 10;
      const totalDuration = 22;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([
        { end: 8.5, start: 0 },
        { end: 15, start: 8.5 },
        { end: 20, start: 15 },
        { end: 22, start: 20 },
      ]);
    });

    it("should handle scenario where no silences exist within chunk duration", () => {
      const silenceResults: TimeRange[] = [{ end: 12.5, start: 12 }];
      const chunkDuration = 10;
      const totalDuration = 30;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([
        { end: 10, start: 0 },
        { end: 12, start: 10 },
        { end: 22, start: 12 },
        { end: 30, start: 22 },
      ]);
    });

    it("should handle the case where totalDuration is less than chunkDuration", () => {
      const silenceResults: TimeRange[] = [];
      const chunkDuration = 10;
      const totalDuration = 5;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([{ end: 5, start: 0 }]);
    });

    it("should handle case where the last silence is after the chunkDuration but not up to totalDuration", () => {
      const silenceResults: TimeRange[] = [
        { end: 9, start: 8 },
        { end: 19, start: 18 },
      ];
      const chunkDuration = 10;
      const totalDuration = 25;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([
        { end: 8, start: 0 },
        { end: 18, start: 8 },
        { end: 25, start: 18 },
      ]);
    });

    it("should produce a single chunk if the chunk duration is greater than the total duration", () => {
      const silenceResults: TimeRange[] = [
        { end: 0.81746, start: 0 },
        { end: 8.354966, start: 7.61737 },
        { end: 15.490794, start: 14.979592 },
        { end: 19.106621, start: 18.758458 },
        { end: 24.567075, start: 24.334376 },
        { end: 28.420635, start: 28.103855 },
      ];

      const chunkDuration = 60;
      const totalDuration = 33.645714;

      const result = mapSilenceResultsToChunkRanges(
        silenceResults,
        chunkDuration,
        totalDuration
      );

      expect(result).toEqual([{ end: 33.645714, start: 0 }]);
    });
  });

  describe("splitFileOnSilences", () => {
    let testFilePath: string;
    let outputDir: string;

    beforeEach(() => {
      vi.clearAllMocks(); // Reset all mocks before each test
      testFilePath =
        "https://github.com/ragaeeb/tafrigh/raw/577b870b887b09f806ca3dba67019950981970a5/testing/khutbah.wav";
    });

    beforeAll(async () => {
      outputDir = await createTempDir();
    });

    it("should split the audio into 4 chunks", async () => {
      const result = await splitFileOnSilences(testFilePath, outputDir, {
        chunkDuration: 10,
        chunkMinThreshold: 0.01,
        silenceDetection: {
          silenceDuration: 0.2,
          silenceThreshold: -35,
        },
      });

      expect(result).toHaveLength(5);

      expect(result[0].range.start).toBeCloseTo(0, 6);
      expect(result[0].range.end).toBeCloseTo(7.343764, 6);
      expect(result[0].filename).toEqual(`${outputDir}/khutbah-chunk-000.wav`);
      expect(await getMediaDuration(result[0].filename)).toBeCloseTo(
        7.343764,
        1
      );

      expect(result[1].range.start).toBeCloseTo(7.343764, 6);
      expect(result[1].range.end).toBeCloseTo(14.872562, 6);
      expect(result[1].filename).toEqual(`${outputDir}/khutbah-chunk-001.wav`);
      expect(await getMediaDuration(result[1].filename)).toBeCloseTo(
        7.528798,
        1
      );

      expect(result[2].range.start).toBeCloseTo(14.872562, 6);
      expect(result[2].range.end).toBeCloseTo(24.311701, 6);
      expect(result[2].filename).toEqual(`${outputDir}/khutbah-chunk-002.wav`);
      expect(await getMediaDuration(result[2].filename)).toBeCloseTo(
        9.439138,
        1
      );

      expect(result[3].range.start).toBeCloseTo(24.311701, 6);
      expect(result[3].range.end).toBeCloseTo(33.169569, 6);
      expect(result[3].filename).toEqual(`${outputDir}/khutbah-chunk-003.wav`);
      expect(await getMediaDuration(result[3].filename)).toBeCloseTo(
        8.857868,
        1
      );

      expect(result[4].range.start).toBeCloseTo(33.169569, 6);
      expect(result[4].range.end).toBeCloseTo(33.593469, 6);
      expect(result[4].filename).toEqual(`${outputDir}/khutbah-chunk-004.wav`);
      expect(await getMediaDuration(result[4].filename)).toBeCloseTo(0.4239, 1);
    });

    it("should filter out any chunks that are smaller than the threshold", async () => {
      testFilePath =
        "https://media.githubusercontent.com/media/ragaeeb/tafrigh/577b870b887b09f806ca3dba67019950981970a5/testing/khutbah.mp3";

      const result = await splitFileOnSilences(testFilePath, outputDir, {
        chunkDuration: 10,
        chunkMinThreshold: 1,
        silenceDetection: {
          silenceDuration: 0.2,
          silenceThreshold: -35,
        },
      });

      expect(result).toHaveLength(4);
    });

    it("should not chunk anything if the total duration of the media <= chunk size", async () => {
      testFilePath =
        "https://media.githubusercontent.com/media/ragaeeb/tafrigh/577b870b887b09f806ca3dba67019950981970a5/testing/khutbah.mp3";
      const mockRun = vi.spyOn(ffmpeg.prototype, "run");

      const result = await splitFileOnSilences(testFilePath, outputDir, {
        chunkDuration: 60,
      });

      expect(result).toEqual([
        { filename: testFilePath, range: { end: 33.5935, start: 0 } },
      ]);
      expect(mockRun).not.toHaveBeenCalled();
    });

    it("should add padding around chunks", async () => {
      testFilePath =
        "https://media.githubusercontent.com/media/ragaeeb/tafrigh/577b870b887b09f806ca3dba67019950981970a5/testing/khutbah.mp3";
      const mockAudioFilters = vi.spyOn(ffmpeg.prototype, "audioFilters");

      await splitFileOnSilences(testFilePath, outputDir, {
        chunkDuration: 10,
        chunkMinThreshold: 1,
        silenceDetection: {
          silenceDuration: 0.2,
          silenceThreshold: -35,
        },
      });

      expect(mockAudioFilters).toHaveBeenCalledTimes(4);
      expect(mockAudioFilters).toHaveBeenCalledWith([
        "apad=pad_dur=0.5",
        "loudnorm",
        "compand",
      ]);
    });

    it("should return an empty array if all the chunks are too short", async () => {
      const result = await splitFileOnSilences(testFilePath, outputDir, {
        chunkDuration: 0.5,
        chunkMinThreshold: 1,
        silenceDetection: {
          silenceDuration: 0.2,
          silenceThreshold: -35,
        },
      });

      expect(result).toHaveLength(0);
    });

    it("should create 2 chunks", async () => {
      const mockSetStartTime = vi.spyOn(ffmpeg.prototype, "setStartTime");
      const mockSetDuration = vi.spyOn(ffmpeg.prototype, "setDuration");

      const result = await splitFileOnSilences(testFilePath, outputDir, {
        chunkDuration: 20,
        chunkMinThreshold: 1,
      });

      expect(result).toHaveLength(3);

      expect(mockSetStartTime).toHaveBeenCalledTimes(3);
      expect(mockSetStartTime).toHaveBeenNthCalledWith(1, 0);

      expect(mockSetDuration).toHaveBeenCalledTimes(3);
    });
  });
});
