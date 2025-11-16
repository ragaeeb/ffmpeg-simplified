import {
  describe,
  expect,
  it,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "bun:test";
import ffmpeg from "../vendor/ffmpegy";
import { formatMedia } from "./formatMedia";
import { createTempDir, fileExists } from "../utils/io";
import { getMediaDuration } from "./getMediaDuration";
import fs from "node:fs";
import path from "node:path";

describe("formatMedia", () => {
  let testFilePath: string;
  let outputFile: string;
  let outputDir: string;

  beforeAll(async () => {
    outputDir = await createTempDir();
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Reset all mocks before each test
    testFilePath = process.env.SAMPLE_MP3_FILE as string;
    outputFile = path.join(outputDir, "output.mp3");
  });

  afterAll(async () => {
    await fs.promises.rm(outputDir, { recursive: true });
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
      outputFile,
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
    await formatMedia(testFilePath, outputFile, {
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

    await formatMedia(testFilePath, outputFile);

    expect(mockAudioChannels).toHaveBeenCalledWith(1);
    expect(mockSave).toHaveBeenCalled();
  });

  it("should correctly output the file", async () => {
    const outputPath = await formatMedia(testFilePath, outputFile);

    const result = await fileExists(outputPath);
    expect(result).toBe(true);

    const duration = await getMediaDuration(testFilePath);
    expect(duration).toBeCloseTo(33.5935, 1);
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is enabled with default options", async () => {
    const mockAudioFilters = vi.spyOn(ffmpeg.prototype, "audioFilters");

    await formatMedia(testFilePath, outputFile, {
      noiseReduction: {},
    });

    expect(mockAudioFilters).toHaveBeenCalledWith([
      "highpass=f=300",
      "asendcmd=0 afftdn sn start",
      "asendcmd=1.5 afftdn sn stop",
      "afftdn=nf=-20",
      "dialoguenhance",
      "lowpass=f=3000",
    ]);
  });

  it("should call ffmpeg with the max number of threads", async () => {
    const mockOutputOptions = vi.spyOn(ffmpeg.prototype, "outputOptions");

    await formatMedia(testFilePath, outputFile, {
      fast: true,
    });

    expect(mockOutputOptions).toHaveBeenCalledWith([
      expect.stringMatching(/-threads \d+/),
    ]);
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is disabled", async () => {
    await formatMedia(testFilePath, outputFile, { noiseReduction: null });
    expect(ffmpeg.prototype.audioFilters).not.toHaveBeenCalled();
  });

  it("should call ffmpeg with the correct arguments when noiseReduction is not provided (default to false)", async () => {
    await formatMedia(testFilePath, outputFile);
    expect(ffmpeg.prototype.audioFilters).toHaveBeenCalled();
  });

  it("should process input as a stream and call ffmpeg with correct arguments", async () => {
    const mockAudioFilters = vi.spyOn(ffmpeg.prototype, "audioFilters");

    const callbacks = {
      onPreprocessingFinished: vi.fn().mockResolvedValue(null),
      onPreprocessingProgress: vi.fn(),
      onPreprocessingStarted: vi.fn().mockResolvedValue(null),
    };

    const fileStream = fs.createReadStream(testFilePath);

    // Run the function using the stream as input
    const outputPath = await formatMedia(
      fileStream,
      outputFile,
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

    // Verify the output file exists
    const result = await fileExists(outputPath);
    expect(result).toBe(true);

    // Check that ffmpeg was called with the correct arguments
    expect(mockAudioFilters).toHaveBeenCalledWith([
      "highpass=f=250",
      "asendcmd=0.5 afftdn sn start",
      "asendcmd=2 afftdn sn stop",
      "afftdn=nf=-25",
      "dialoguenhance",
      "lowpass=f=3500",
    ]);

    // Ensure callbacks were invoked correctly
    expect(callbacks.onPreprocessingStarted).toHaveBeenCalledOnce();
    expect(callbacks.onPreprocessingStarted).toHaveBeenCalledWith(
      expect.any(String)
    );

    expect(callbacks.onPreprocessingProgress).toHaveBeenCalledWith(
      expect.any(Number)
    );

    expect(callbacks.onPreprocessingFinished).toHaveBeenCalledOnce();
    expect(callbacks.onPreprocessingFinished).toHaveBeenCalledWith(
      expect.any(String)
    );
  });
});
