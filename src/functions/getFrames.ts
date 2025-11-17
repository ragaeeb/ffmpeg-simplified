import path from 'node:path';
import type { Frame, GetFramesOptions } from '@/types';
import { mapCropOptionsToCropFilter } from '@/utils/cropping';
import { collectFramePaths, mapFramePreprocessingToFilter } from '@/utils/framePreprocessing';
import logger from '@/utils/logger';
import { FFmpeggy } from '@/vendor/ffmpeggy';
import { getVideoDimensions } from './getVideoDimensions';

/**
 * Extracts still frames from a video file and writes them to disk according to the provided options.
 *
 * @param {string} videoFile - Path to the input video file.
 * @param {GetFramesOptions} options - Extraction options including output folder, frequency and preprocessing choices.
 * @returns {Promise<Frame[]>} Promise resolving with ordered frame descriptors for the generated images.
 */
export const getFrames = async (videoFile: string, options: GetFramesOptions): Promise<Frame[]> => {
    const [width, height] = await getVideoDimensions(videoFile);
    const { fileExtension = '.jpg', filePrefix = 'frame_' } = options;

    return new Promise((resolve, reject) => {
        const filters = [
            `fps=1/${options.frequency}`,
            options.cropOptions && mapCropOptionsToCropFilter(width, height, options.cropOptions),
            options.preprocessingOptions && mapFramePreprocessingToFilter(options.preprocessingOptions),
        ].filter(Boolean) as string[];

        const outputPattern = path.join(options.outputFolder, `${filePrefix}%04d${fileExtension}`);

        const ffmpeggy = new FFmpeggy({
            autorun: true,
            input: videoFile,
            output: outputPattern,
            outputOptions: [`-vf ${filters.join(',')}`, '-vsync vfr', '-start_number 0'],
        });

        ffmpeggy.on('done', async () => {
            logger.info('Frame extraction completed.');
            const framePaths = await collectFramePaths(
                options.outputFolder,
                filePrefix,
                fileExtension,
                options.frequency,
            );
            resolve(framePaths);
        });

        ffmpeggy.on('error', (err) => {
            logger.error(err, 'Error during frame extraction:');
            reject(err);
        });
    });
};
