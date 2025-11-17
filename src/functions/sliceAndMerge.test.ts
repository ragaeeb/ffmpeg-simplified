import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { TimeRange } from '../types';
import { createTempDir } from '../utils/io';
import { getMediaDuration } from './getMediaDuration';
import { sliceAndMerge } from './sliceAndMerge';

describe('sliceAndMerge', () => {
    let outputFolder: string;

    beforeEach(async () => {
        outputFolder = await createTempDir();
    });

    afterEach(async () => {
        await fs.rm(outputFolder, { recursive: true });
    });

    it('should slice the video into 2 chunks then merge the chunks together back to 1 video using time codes', async () => {
        const result = await sliceAndMerge(
            process.env.SAMPLE_MP4_FILE as string,
            path.join(outputFolder, 'slicedAndMerged.mp4'),
            {
                ranges: ['0-0:04', '0:06-0:08'],
            },
        );

        expect(await getMediaDuration(result)).toBeCloseTo(5.99, 1);
    });

    it('should handle timecode with hours, minutes, and seconds', async () => {
        const result = await sliceAndMerge(
            process.env.SAMPLE_MP4_FILE as string,
            path.join(outputFolder, 'slicedAndMerged.mp4'),
            {
                ranges: ['0:00:00-0:00:04', '0:00:06-0:00:08'],
            },
        );

        expect(await getMediaDuration(result)).toBeCloseTo(5.99, 1);
    });

    it('should handle timecode ranges with only start time (end defaults to duration)', async () => {
        const result = await sliceAndMerge(
            process.env.SAMPLE_MP4_FILE as string,
            path.join(outputFolder, 'slicedAndMerged.mp4'),
            {
                ranges: ['0:00:00-'],
            },
        );

        const originalDuration = await getMediaDuration(process.env.SAMPLE_MP4_FILE as string);
        expect(await getMediaDuration(result)).toBeCloseTo(originalDuration, 1);
    });

    it('should handle numeric time ranges', async () => {
        const ranges: TimeRange[] = [
            { end: 4, start: 0 },
            { end: 8, start: 6 },
        ];

        const result = await sliceAndMerge(
            process.env.SAMPLE_MP4_FILE as string,
            path.join(outputFolder, 'slicedAndMerged.mp4'),
            {
                ranges,
            },
        );

        expect(await getMediaDuration(result)).toBeCloseTo(5.99, 1);
    });

    it('should throw error when ranges array is empty', async () => {
        await expect(
            sliceAndMerge(process.env.SAMPLE_MP4_FILE as string, path.join(outputFolder, 'slicedAndMerged.mp4'), {
                ranges: [],
            }),
        ).rejects.toThrow('Ranges array cannot be empty');
    });

    it('should throw error when range has invalid end time', async () => {
        await expect(
            sliceAndMerge(process.env.SAMPLE_MP4_FILE as string, path.join(outputFolder, 'slicedAndMerged.mp4'), {
                ranges: ['0:00:00-', '0:00:05-'],
            }),
        ).rejects.toThrow('Invalid ranges specified');
    });

    it('should handle fast mode option', async () => {
        const result = await sliceAndMerge(
            process.env.SAMPLE_MP4_FILE as string,
            path.join(outputFolder, 'slicedAndMerged.mp4'),
            {
                fast: true,
                ranges: ['0-0:04'],
            },
        );

        expect(await getMediaDuration(result)).toBeCloseTo(4, 1);
    });

    it('should handle complex timecode formats', async () => {
        const result = await sliceAndMerge(
            process.env.SAMPLE_MP4_FILE as string,
            path.join(outputFolder, 'slicedAndMerged.mp4'),
            {
                ranges: ['0:0:0-0:0:2', '0:0:3-0:0:5'],
            },
        );

        expect(await getMediaDuration(result)).toBeCloseTo(4, 1);
    });
});
