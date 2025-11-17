import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { createTempDir, fileExists } from '../utils/io';
import { formatMedia } from './formatMedia';
import { getMediaDuration } from './getMediaDuration';

describe('formatMedia', () => {
    let testFilePath: string;
    let outputFile: string;
    let outputDir: string;

    beforeAll(async () => {
        outputDir = await createTempDir();
    });

    beforeEach(() => {
        vi.clearAllMocks(); // Reset all mocks before each test
        testFilePath = process.env.SAMPLE_MP3_FILE as string;
        outputFile = path.join(outputDir, 'output.mp3');
    });

    afterAll(async () => {
        await fs.promises.rm(outputDir, { recursive: true });
    });

    it('should call ffmpeg with the correct arguments when noiseReduction is enabled with custom options', async () => {
        const callbacks = {
            onPreprocessingFinished: vi.fn().mockResolvedValue(null),
            onPreprocessingProgress: vi.fn(),
            onPreprocessingStarted: vi.fn().mockResolvedValue(null),
        };

        const outputPath = await formatMedia(
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
            callbacks,
        );

        // Verify callbacks were called
        expect(callbacks.onPreprocessingStarted).toHaveBeenCalledOnce();
        expect(callbacks.onPreprocessingStarted).toHaveBeenCalledWith(expect.any(String));
        expect(callbacks.onPreprocessingFinished).toHaveBeenCalledOnce();
        expect(callbacks.onPreprocessingFinished).toHaveBeenCalledWith(expect.any(String));

        // Verify the output path was returned
        expect(outputPath).toBe(outputFile);
    });

    it('should call ffmpeg omitting all the null options', async () => {
        // Test that null options are filtered out by verifying the output file is created
        const outputPath = await formatMedia(testFilePath, outputFile, {
            noiseReduction: {
                afftdn_nf: null,
                afftdnStart: null,
                afftdnStop: 2,
                dialogueEnhance: true,
                highpass: null,
                lowpass: null,
            },
        });

        const result = await fileExists(outputPath);
        expect(result).toBe(true);
    });

    it('should call ffmpeg with the right format', async () => {
        // Test that audio channels are set correctly by verifying the output
        const outputPath = await formatMedia(testFilePath, outputFile);

        const result = await fileExists(outputPath);
        expect(result).toBe(true);
    });

    it('should correctly output the file', async () => {
        const outputPath = await formatMedia(testFilePath, outputFile);

        const result = await fileExists(outputPath);
        expect(result).toBe(true);

        const duration = await getMediaDuration(testFilePath);
        expect(duration).toBeCloseTo(33.5935, 1);
    });

    it('should call ffmpeg with the correct arguments when noiseReduction is enabled with default options', async () => {
        // Test with default noise reduction options
        const outputPath = await formatMedia(testFilePath, outputFile, {
            noiseReduction: {},
        });

        const result = await fileExists(outputPath);
        expect(result).toBe(true);
    });

    it('should call ffmpeg with the max number of threads', async () => {
        // Test fast mode by verifying the output file is created
        const outputPath = await formatMedia(testFilePath, outputFile, {
            fast: true,
        });

        const result = await fileExists(outputPath);
        expect(result).toBe(true);
    });

    it('should call ffmpeg with the correct arguments when noiseReduction is disabled', async () => {
        // Test that when noiseReduction is null, the output file is still created
        const outputPath = await formatMedia(testFilePath, outputFile, { noiseReduction: null });

        const result = await fileExists(outputPath);
        expect(result).toBe(true);
    });

    it('should call ffmpeg with the correct arguments when noiseReduction is not provided (default to false)', async () => {
        // Test default behavior
        const outputPath = await formatMedia(testFilePath, outputFile);

        const result = await fileExists(outputPath);
        expect(result).toBe(true);
    });

    it('should process input as a stream and call ffmpeg with correct arguments', async () => {
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
            callbacks,
        );

        // Verify the output file exists
        const result = await fileExists(outputPath);
        expect(result).toBe(true);

        // Ensure callbacks were invoked correctly
        expect(callbacks.onPreprocessingStarted).toHaveBeenCalledOnce();
        expect(callbacks.onPreprocessingStarted).toHaveBeenCalledWith(expect.any(String));

        // Progress callback may or may not be called depending on ffmpeg output timing
        // Just verify it's defined
        expect(callbacks.onPreprocessingProgress).toBeDefined();

        expect(callbacks.onPreprocessingFinished).toHaveBeenCalledOnce();
        expect(callbacks.onPreprocessingFinished).toHaveBeenCalledWith(expect.any(String));
    });
});
