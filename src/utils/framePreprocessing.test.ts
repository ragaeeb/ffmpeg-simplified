import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
    mapFramePreprocessingToFilter,
    collectFramePaths,
} from './framePreprocessing';
import { FramePreprocessingPreset } from '../types';
import { createTempDir } from './io';

describe('framePreprocessing', () => {
    describe('mapFramePreprocessingToFilter', () => {
        it('should return grayscale filter for DarkTextOnLightBackground preset', () => {
            const filter = mapFramePreprocessingToFilter(
                FramePreprocessingPreset.DarkTextOnLightBackground,
            );
            expect(filter).toBe('format=gray');
        });

        it('should return grayscale filter for LightTextOnDarkBackground preset', () => {
            const filter = mapFramePreprocessingToFilter(
                FramePreprocessingPreset.LightTextOnDarkBackground,
            );
            expect(filter).toBe('format=gray');
        });

        it('should return grayscale filter when grayscale option is true', () => {
            const filter = mapFramePreprocessingToFilter({ grayscale: true });
            expect(filter).toBe('format=gray');
        });

        it('should return empty string when grayscale option is false', () => {
            const filter = mapFramePreprocessingToFilter({ grayscale: false });
            expect(filter).toBe('');
        });

        it('should return empty string when grayscale option is undefined', () => {
            const filter = mapFramePreprocessingToFilter({});
            expect(filter).toBe('');
        });
    });

    describe('collectFramePaths', () => {
        let outputFolder: string;

        beforeEach(async () => {
            outputFolder = await createTempDir();
        });

        afterEach(async () => {
            await fs.rm(outputFolder, { recursive: true });
        });

        it('should collect frame paths and extract timestamps', async () => {
            // Create test frame files
            const frameFiles = [
                'frame_0000.jpg',
                'frame_0001.jpg',
                'frame_0002.jpg',
                'frame_0003.jpg',
            ];

            for (const file of frameFiles) {
                await fs.writeFile(path.join(outputFolder, file), 'test');
            }

            // Add a non-frame file to ensure filtering works
            await fs.writeFile(path.join(outputFolder, 'other.txt'), 'test');

            const frequency = 5;
            const frames = await collectFramePaths(
                outputFolder,
                'frame_',
                '.jpg',
                frequency,
            );

            expect(frames).toHaveLength(4);
            expect(frames[0]).toEqual({
                filename: path.join(outputFolder, 'frame_0000.jpg'),
                start: 0,
            });
            expect(frames[1]).toEqual({
                filename: path.join(outputFolder, 'frame_0001.jpg'),
                start: 5,
            });
            expect(frames[2]).toEqual({
                filename: path.join(outputFolder, 'frame_0002.jpg'),
                start: 10,
            });
            expect(frames[3]).toEqual({
                filename: path.join(outputFolder, 'frame_0003.jpg'),
                start: 15,
            });
        });

        it('should sort frames by start time', async () => {
            // Create frames out of order
            await fs.writeFile(path.join(outputFolder, 'frame_0002.jpg'), 'test');
            await fs.writeFile(path.join(outputFolder, 'frame_0000.jpg'), 'test');
            await fs.writeFile(path.join(outputFolder, 'frame_0001.jpg'), 'test');

            const frames = await collectFramePaths(
                outputFolder,
                'frame_',
                '.jpg',
                5,
            );

            expect(frames).toHaveLength(3);
            expect(frames[0].start).toBe(0);
            expect(frames[1].start).toBe(5);
            expect(frames[2].start).toBe(10);
        });

        it('should filter files by prefix and extension', async () => {
            await fs.writeFile(path.join(outputFolder, 'frame_0000.jpg'), 'test');
            await fs.writeFile(path.join(outputFolder, 'frame_0000.png'), 'test');
            await fs.writeFile(path.join(outputFolder, 'other_0000.jpg'), 'test');
            await fs.writeFile(path.join(outputFolder, 'frame_0001.jpg'), 'test');

            const frames = await collectFramePaths(
                outputFolder,
                'frame_',
                '.jpg',
                5,
            );

            expect(frames).toHaveLength(2);
            expect(frames.every((f) => f.filename.endsWith('.jpg'))).toBe(true);
            expect(frames.every((f) => f.filename.includes('frame_'))).toBe(true);
        });

        it('should return empty array when no matching frames exist', async () => {
            await fs.writeFile(path.join(outputFolder, 'other.txt'), 'test');

            const frames = await collectFramePaths(
                outputFolder,
                'frame_',
                '.jpg',
                5,
            );

            expect(frames).toHaveLength(0);
        });

        it('should handle different file extensions', async () => {
            await fs.writeFile(path.join(outputFolder, 'frame_0000.png'), 'test');
            await fs.writeFile(path.join(outputFolder, 'frame_0001.png'), 'test');

            const frames = await collectFramePaths(
                outputFolder,
                'frame_',
                '.png',
                3,
            );

            expect(frames).toHaveLength(2);
            expect(frames[0].start).toBe(0);
            expect(frames[1].start).toBe(3);
        });

        it('should handle different prefixes', async () => {
            await fs.writeFile(path.join(outputFolder, 'thumb_0000.jpg'), 'test');
            await fs.writeFile(path.join(outputFolder, 'thumb_0001.jpg'), 'test');

            const frames = await collectFramePaths(
                outputFolder,
                'thumb_',
                '.jpg',
                10,
            );

            expect(frames).toHaveLength(2);
            expect(frames[0].start).toBe(0);
            expect(frames[1].start).toBe(10);
        });
    });
});

