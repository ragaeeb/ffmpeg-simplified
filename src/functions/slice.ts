import os from 'node:os';
import path from 'node:path';
import type { SliceOptions } from '@/types';
import logger from '@/utils/logger';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Slices a media file into multiple parts based on specified time ranges.
 *
 * @param {string} file - Path to the input media file.
 * @param {SliceOptions} options - Options containing the time ranges and output folder.
 * @returns {Promise<string[]>} - Promise resolving to an array of paths to the sliced files.
 */
export const slice = async (file: string, options: SliceOptions): Promise<string[]> => {
    const outputFiles: string[] = [];
    const fileName = path.basename(file, path.extname(file));
    const fileExtension = path.extname(file);

    for (let i = 0; i < options.ranges.length; i++) {
        const { start, end } = options.ranges[i];
        const outputFile = path.join(options.outputFolder, `${fileName}_${i + 1}${fileExtension}`);

        const outputOptions: string[] = [];
        if (options.fast) {
            outputOptions.push(`-threads ${os.cpus().length}`);
            logger.debug(`Using fast mode with ${os.cpus().length} threads for slicing`);
        }

        const ffmpeggy = new FFmpeggy({
            autorun: true,
            input: file,
            inputOptions: [`-ss ${start}`],
            output: outputFile,
            outputOptions: [...outputOptions, `-t ${end - start}`],
            overwriteExisting: true,
        });

        await ffmpeggy.done();
        logger.info(`Sliced video saved as ${outputFile}`);
        outputFiles.push(outputFile);
    }

    return outputFiles;
};
