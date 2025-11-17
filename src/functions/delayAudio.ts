import logger from '@/utils/logger';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Adjusts audio synchronization in a video file by applying a delay or advance to the audio track.
 *
 * @param {string} inputFile - Path to the input video file.
 * @param {string} outputFile - Path where the output file will be saved.
 * @param {number} delayInSeconds - Delay in seconds (negative values advance the audio).
 * @returns {Promise<string>} - Promise resolving to the path of the output file.
 */
export const delayAudio = async (inputFile: string, outputFile: string, delayInSeconds: number): Promise<string> => {
    logger.info(`Adjusting audio sync in ${inputFile} by ${delayInSeconds} seconds`);

    // Convert delay to milliseconds for adelay filter
    const delayMs = Math.abs(delayInSeconds * 1000);

    const ffmpeggy = new FFmpeggy({
        autorun: true,
        input: inputFile,
        output: outputFile,
        outputOptions: [
            '-c:v copy',
            '-c:a aac',
            delayInSeconds >= 0 ? `-af adelay=${delayMs}|${delayMs}` : `-itsoffset ${delayInSeconds}`,
        ],
        overwriteExisting: true,
    });

    await ffmpeggy.done();
    logger.info(`Audio sync adjusted, saved to ${outputFile}`);
    return outputFile;
};
