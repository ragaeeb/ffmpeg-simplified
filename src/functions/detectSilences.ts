import os from 'node:os';
import type { SilenceDetectionOptions, TimeRange } from '@/types';
import { FFmpeggy } from '@/vendor/ffmpeggy';

/**
 * Parses ffmpeg silencedetect output lines into {@link TimeRange} objects.
 * Supports both integer and floating-point values, and skips invalid or degenerate intervals.
 *
 * @param {string[]} silenceLines - Raw stderr lines emitted by ffmpeg's silencedetect filter.
 * @returns {TimeRange[]} Normalised silence intervals sorted by appearance order.
 */
export const mapOutputToSilenceResults = (silenceLines: string[]): TimeRange[] => {
    const silences: TimeRange[] = [];
    let currentSilenceStart: number | null = null;

    for (const line of silenceLines) {
        if (line.includes('silence_start')) {
            const match = line.match(/silence_start: (\d+(?:\.\d+)?)/);
            if (match) {
                const parsed = parseFloat(match[1]);
                currentSilenceStart = !Number.isNaN(parsed) ? parsed : null;
            } else {
                currentSilenceStart = null;
            }
        } else if (line.includes('silence_end') && currentSilenceStart !== null) {
            const match = line.match(/silence_end: (\d+(?:\.\d+)?)/);
            if (match) {
                const silenceEnd = parseFloat(match[1]);
                // only add if valid and end > start
                if (!Number.isNaN(silenceEnd) && silenceEnd > currentSilenceStart) {
                    silences.push({ end: silenceEnd, start: currentSilenceStart });
                }
            }
            currentSilenceStart = null;
        }
    }

    return silences;
};

/**
 * Detects silences in an audio file based on specified threshold and duration.
 *
 * @param {string} filePath - Path to the input audio file.
 * @param {SilenceDetectionOptions} options - Options for silence detection.
 * @returns {Promise<TimeRange[]>} - Promise resolving to an array of time ranges where silence was detected.
 */
export const detectSilences = (
    filePath: string,
    { silenceDuration, silenceThreshold }: SilenceDetectionOptions,
): Promise<TimeRange[]> => {
    return new Promise<TimeRange[]>((resolve, reject) => {
        const silenceLines: string[] = [];
        const nullSink = os.platform() === 'win32' ? 'NUL' : '/dev/null';

        const ffmpeggy = new FFmpeggy({
            autorun: false, // Don't autorun so we can set up stderr listener first
            input: filePath,
            output: nullSink,
            outputOptions: [`-af silencedetect=n=${silenceThreshold}dB:d=${silenceDuration}`, '-f null'],
        });

        // Capture stderr output - ffmpeggy stores process as this.process
        let stderrBuffer = '';

        // Set up stderr listener function
        const setupStderrListener = (proc: any) => {
            if (proc?.stderr) {
                proc.stderr.on('data', (chunk: Buffer) => {
                    stderrBuffer += chunk.toString();
                    const lines = stderrBuffer.split('\n');
                    stderrBuffer = lines.pop() || '';
                    silenceLines.push(...lines);
                });
            }
        };

        // Start the process - run() returns the process synchronously
        const runPromise = ffmpeggy.run();
        
        // Try to set up listener immediately - process should be available synchronously
        // Use setImmediate to ensure process is created but before stderr data flows
        setImmediate(() => {
            const proc = (ffmpeggy as any).process;
            setupStderrListener(proc);
        });

        // Also try on 'start' event
        ffmpeggy.on('start', () => {
            const proc = (ffmpeggy as any).process;
            setupStderrListener(proc);
        });

        // Handle run() promise errors
        runPromise.catch(reject);

        ffmpeggy.on('done', () => {
            const silences = mapOutputToSilenceResults(silenceLines);
            resolve(silences);
        });

        ffmpeggy.on('error', (err) => {
            reject(err);
        });
    });
};
