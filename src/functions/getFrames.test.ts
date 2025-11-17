import { afterAll, beforeAll, describe, expect, it, vi } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CropPreset, FramePreprocessingPreset } from '../types';
import { createTempDir } from '../utils/io';
import { getFrames } from './getFrames';
import { getVideoDimensions } from './getVideoDimensions';

describe('getFrames', () => {
    let outputFolder: string;

    beforeAll(async () => {
        outputFolder = await createTempDir();
    });

    afterAll(async () => {
        await fs.rm(outputFolder, { recursive: true });
    });

    it('should output the frames', async () => {
        const result = await getFrames(process.env.SAMPLE_MP4_FILE as string, {
            cropOptions: CropPreset.VerticallyCenteredText,
            frequency: 5,
            outputFolder,
            preprocessingOptions: FramePreprocessingPreset.DarkTextOnLightBackground,
        });

        expect(result).toEqual([
            { filename: path.join(outputFolder, 'frame_0000.jpg'), start: 0 },
            { filename: path.join(outputFolder, 'frame_0001.jpg'), start: 5 },
        ]);

        expect(await getVideoDimensions(result[0].filename)).toEqual([320, 108]);
        expect(await getVideoDimensions(result[1].filename)).toEqual([320, 108]);
    });

    it('should reject when collectFramePaths fails due to missing output folder', async () => {
        const nonExistentFolder = path.join(outputFolder, 'does-not-exist');

        await expect(
            getFrames(process.env.SAMPLE_MP4_FILE as string, {
                frequency: 5,
                outputFolder: nonExistentFolder,
            }),
        ).rejects.toThrow();
    });

    it('should reject when collectFramePaths fails due to permission error', async () => {
        const restrictedFolder = path.join(outputFolder, 'restricted');
        await fs.mkdir(restrictedFolder);

        // Make the folder unreadable
        await fs.chmod(restrictedFolder, 0o000);

        try {
            await expect(
                getFrames(process.env.SAMPLE_MP4_FILE as string, {
                    frequency: 5,
                    outputFolder: restrictedFolder,
                }),
            ).rejects.toThrow();
        } finally {
            // Restore permissions for cleanup
            await fs.chmod(restrictedFolder, 0o755);
        }
    });
});
