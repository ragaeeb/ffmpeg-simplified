import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createTempDir } from '../utils/io';
import { getMediaDuration } from './getMediaDuration';
import { mergeSlices } from './merge';
import { slice } from './slice';

describe('merge', () => {
    let outputFolder: string;

    beforeEach(async () => {
        outputFolder = await createTempDir();
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    afterEach(async () => {
        await fs.rm(outputFolder, { recursive: true });
    });

    it('should merge the slices', async () => {
        const chunks = await slice(process.env.SAMPLE_MP4_FILE as string, {
            fast: true,
            outputFolder,
            ranges: [
                { end: 4, start: 0 },
                { end: 8, start: 6 },
            ],
        });

        const mergedFile = path.join(outputFolder, 'merged.mp4');

        const result = await mergeSlices(chunks, mergedFile);
        expect(result).toEqual(mergedFile);

        // Wait a bit for file system to sync
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Verify file exists and get duration
        const duration = await getMediaDuration(result);
        expect(duration).toBeCloseTo(6, 1);
    });
});
