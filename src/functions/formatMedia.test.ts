import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";
import ffmpeg from "fluent-ffmpeg";
import { formatMedia } from "./formatMedia";
import { createTempDir, fileExists } from "../utils/io";
import { getMediaDuration } from "./getMediaDuration";
import path from "node:path";

describe("formatMedia", () => {
  let testFilePath: string;
  let outputDir: string;

  beforeAll(async () => {
    outputDir = await createTempDir();
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Reset all mocks before each test
    testFilePath =
      "https://d38nvwmjovqyq6.cloudfront.net/va90web25003/companions/ws_smith/18%20Double%20Consonants.mp3";
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is enabled with custom options", async () => {
    const mockAudioFilters = vi.spyOn(ffmpeg.prototype, "audioFilters");

    const callbacks = {
      onPreprocessingFinished: vi.fn().mockResolvedValue(null),
      onPreprocessingProgress: vi.fn(),
      onPreprocessingStarted: vi.fn().mockResolvedValue(null),
    };

    // Run the actual function with noiseReduction enabled with custom values
    await formatMedia(
      testFilePath,
      outputDir,
      {
        noiseReduction: {
          afftdn_nf: -25,
          afftdnStart: 0.5,
          afftdnStop: 2,
          dialogueEnhance: true,
          highpass: 250,
          lowpass: 3500,
        },
      },
      callbacks
    );

    expect(mockAudioFilters).toHaveBeenCalledWith([
      "highpass=f=250",
      "asendcmd=0.5 afftdn sn start",
      "asendcmd=2 afftdn sn stop",
      "afftdn=nf=-25",
      "dialoguenhance",
      "lowpass=f=3500",
    ]);

    expect(callbacks.onPreprocessingStarted).toHaveBeenCalledOnce();
    expect(callbacks.onPreprocessingStarted).toHaveBeenCalledWith(
      expect.any(String)
    );

    expect(callbacks.onPreprocessingProgress).toHaveBeenCalledTimes(1);
    expect(callbacks.onPreprocessingProgress).toHaveBeenCalledWith(
      expect.any(Number)
    );

    expect(callbacks.onPreprocessingFinished).toHaveBeenCalledOnce();
    expect(callbacks.onPreprocessingFinished).toHaveBeenCalledWith(
      expect.any(String)
    );
  });

  it("should call ffmpeg omitting all the null options", async () => {
    const mockAudioFilters = vi.spyOn(ffmpeg.prototype, "audioFilters");

    // Run the actual function with noiseReduction enabled with custom values
    await formatMedia(testFilePath, outputDir, {
      noiseReduction: {
        afftdn_nf: null,
        afftdnStart: null,
        afftdnStop: 2,
        dialogueEnhance: true,
        highpass: null,
        lowpass: null,
      },
    });

    expect(mockAudioFilters).toHaveBeenCalledWith(["dialoguenhance"]);
  });

  it("should call ffmpeg with the right format", async () => {
    const mockAudioChannels = vi.spyOn(ffmpeg.prototype, "audioChannels");
    const mockSave = vi.spyOn(ffmpeg.prototype, "save");

    await formatMedia(testFilePath, outputDir);

    expect(mockAudioChannels).toHaveBeenCalledWith(1);
    expect(mockSave).toHaveBeenCalled();
  });

  it("should correctly output the file", async () => {
    const outputPath = await formatMedia(testFilePath, outputDir);

    const result = await fileExists(outputPath);
    expect(result).toBe(true);

    const duration = await getMediaDuration(testFilePath);
    expect(duration).toBeCloseTo(22.256, 3);
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is enabled with default options", async () => {
    const mockAudioFilters = vi.spyOn(ffmpeg.prototype, "audioFilters");

    await formatMedia(testFilePath, outputDir, { noiseReduction: {} });

    expect(mockAudioFilters).toHaveBeenCalledWith([
      "highpass=f=300",
      "asendcmd=0 afftdn sn start",
      "asendcmd=1.5 afftdn sn stop",
      "afftdn=nf=-20",
      "dialoguenhance",
      "lowpass=f=3000",
    ]);
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is disabled", async () => {
    await formatMedia(testFilePath, outputDir, { noiseReduction: null });
    expect(ffmpeg.prototype.audioFilters).not.toHaveBeenCalled();
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is not provided (default to false)", async () => {
    await formatMedia(testFilePath, outputDir);
    expect(ffmpeg.prototype.audioFilters).toHaveBeenCalled();
  });
});
