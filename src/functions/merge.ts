import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { MergeOptions } from '@/types';
import { generateHashFromInputFiles } from '@/utils/io';
import logger from '@/utils/logger';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Merges multiple media files into a single output file.
 *
 * @param {string[]} inputFiles - Array of paths to the media files to merge.
 * @param {string} outputFile - Path where the merged file will be saved.
 * @param {MergeOptions} [options] - Optional settings such as fast mode to control FFmpeg behaviour.
 * @returns {Promise<string>} Promise resolving to the path of the merged output file.
 */
export const mergeSlices = async (
    inputFiles: string[],
    outputFile: string,
    options: MergeOptions = {},
): Promise<string> => {
    const concatFile = path.join(
        os.tmpdir(),
        path.format({ ext: '.txt', name: generateHashFromInputFiles(inputFiles) }),
    );

    const fileContent = inputFiles.map((file) => `file '${file}'`).join('\n');
    await fs.writeFile(concatFile, fileContent);

    try {
        const outputOptions = ['-c copy'];
        if (options.fast) {
            outputOptions.push(`-threads ${os.cpus().length}`);
        }

        const ffmpeggy = new FFmpeggy({
            autorun: true,
            input: concatFile,
            inputOptions: ['-f concat', '-safe 0'],
            output: outputFile,
            outputOptions,
            overwriteExisting: true,
        });

        await ffmpeggy.done();
        logger.info(`Merged video saved as ${outputFile}`);
    } finally {
        await fs.rm(concatFile, { recursive: true });
    }

    return outputFile;
};
