import type { Logger } from '@/types';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Adjusts audio synchronization in a video file by applying a delay or advance to the audio track.
 *
 * @param {string} inputFile - Path to the input video file.
 * @param {string} outputFile - Path where the output file will be saved.
 * @param {number} delayInSeconds - Delay in seconds (negative values advance the audio).
 * @param {Logger} [logger] - Optional logger for info messages.
 * @returns {Promise<string>} - Promise resolving to the path of the output file.
 */
export const delayAudio = async (
    inputFile: string,
    outputFile: string,
    delayInSeconds: number,
    logger?: Logger,
): Promise<string> => {
    if (logger?.info) {
        logger.info(`Adjusting audio sync in ${inputFile} by ${delayInSeconds} seconds`);
    }

    // Probe to get audio channel count
    const metadata = await FFmpeggy.probe(inputFile);
    const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
    const channels = audioStream?.channels || 2;

    const delayMs = Math.abs(delayInSeconds * 1000);
    const audioFilter =
        delayInSeconds >= 0
            ? `-af adelay=delays=${Array(channels).fill(delayMs).join('|')}:all=1`
            : `-af atrim=start=${Math.abs(delayInSeconds)}`;

    const ffmpeggy = new FFmpeggy({
        autorun: true,
        input: inputFile,
        output: outputFile,
        outputOptions: ['-c:v copy', '-c:a aac', audioFilter],
        overwriteExisting: true,
    });

    await ffmpeggy.done();

    if (logger?.info) {
        logger.info(`Audio sync adjusted, saved to ${outputFile}`);
    }

    return outputFile;
};
