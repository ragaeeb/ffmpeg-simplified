import logger from '@/utils/logger';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Replaces the audio track of a video file with a new audio file.
 *
 * @param {string} videoFile - Path to the input video file.
 * @param {string} audioFile - Path to the new audio file.
 * @param {string} outputFile - Path where the output video will be saved.
 * @returns {Promise<string>} - Promise resolving to the path of the output video file.
 */
export const replaceAudio = async (videoFile: string, audioFile: string, outputFile: string): Promise<string> => {
    logger.info(`Replacing audio in ${videoFile} with ${audioFile}`);

    const ffmpeggy = new FFmpeggy({
        autorun: true,
        input: videoFile,
        output: outputFile,
        outputOptions: ['-c:v copy', '-c:a aac', '-strict experimental', '-map 0:v:0', '-map 1:a:0'],
        overwriteExisting: true,
    });

    // Add second input
    ffmpeggy.setInput(audioFile);

    await ffmpeggy.done();
    return outputFile;
};
