import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Logger, MergeOptions } from '@/types';
import { generateHashFromInputFiles } from '@/utils/io';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Merges multiple media files into a single output file.
 *
 * @param {string[]} inputFiles - Array of paths to the media files to merge.
 * @param {string} outputFile - Path where the merged file will be saved.
 * @param {MergeOptions} [options] - Optional settings such as fast mode to control FFmpeg behaviour.
 * @param {Logger} [logger] - Optional logger for info and error messages.
 * @returns {Promise<string>} Promise resolving to the path of the merged output file.
 */
export const mergeSlices = async (
    inputFiles: string[],
    outputFile: string,
    options: MergeOptions = {},
    logger?: Logger,
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

        await new Promise<void>((resolve, reject) => {
            ffmpeggy.on('done', () => {
                logger?.info?.(`Merged video saved as ${outputFile}`);
                resolve();
            });
            ffmpeggy.on('error', (err) => {
                logger?.error?.(`Error during merge: ${err.message}`);
                reject(err);
            });
        });
    } finally {
        await fs.rm(concatFile, { recursive: true });
    }

    return outputFile;
};
