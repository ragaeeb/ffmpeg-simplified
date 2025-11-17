import { FFmpeggy } from 'ffmpeggy';
import which from 'which';

/**
 * Configure FFmpeggy to use system-installed ffmpeg and ffprobe binaries.
 * This ensures compatibility across different environments, especially in server contexts.
 */
try {
    const ffmpegPath = which.sync('ffmpeg');
    const ffprobePath = which.sync('ffprobe');

    FFmpeggy.DefaultConfig = {
        ...FFmpeggy.DefaultConfig,
        ffmpegBin: ffmpegPath,
        ffprobeBin: ffprobePath,
    };
} catch {
    // If which fails, ffmpeggy will fall back to PATH lookup
    // or use FFMPEG_PATH/FFPROBE_PATH environment variables
    console.warn('Could not locate ffmpeg/ffprobe binaries via which, falling back to default lookup');
}

export { FFmpeggy };
export default FFmpeggy;
