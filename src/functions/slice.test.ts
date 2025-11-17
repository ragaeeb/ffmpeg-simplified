import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createTempDir } from '../utils/io';
import { getMediaDuration } from './getMediaDuration';
import { slice } from './slice';

describe('slice', () => {
    let outputFolder: string;

    beforeEach(async () => {
        outputFolder = await createTempDir();
    });

    afterEach(async () => {
        await fs.rm(outputFolder, { recursive: true });
    });

    it('should replace audio in the video file and resolve with the output file', async () => {
        const result = await slice(process.env.SAMPLE_MP4_FILE as string, {
            outputFolder,
            ranges: [
                { end: 4, start: 0 },
                { end: 8, start: 6 },
            ],
        });

        expect(result).toEqual([path.join(outputFolder, 'sample_1.mp4'), path.join(outputFolder, 'sample_2.mp4')]);

        expect(await getMediaDuration(result[0])).toBeCloseTo(4.008, 1);
        expect(await getMediaDuration(result[1])).toBeCloseTo(2.008, 1);
    });
});
