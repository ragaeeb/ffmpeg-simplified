import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Retrieves the pixel width and height of the first video stream in a media file.
 *
 * @param {string} videoFilePath - Absolute or relative path to the media file to inspect.
 * @returns {Promise<[number, number]>} Promise resolving with a tuple containing the width and height in pixels.
 */
export const getVideoDimensions = async (videoFilePath: string): Promise<[number, number]> => {
    const metadata = await FFmpeggy.probe(videoFilePath);
    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

    if (!videoStream || !videoStream.width || !videoStream.height) {
        throw new Error('Could not determine video dimensions.');
    }

    return [videoStream.width, videoStream.height];
};
