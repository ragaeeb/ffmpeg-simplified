import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import type { ReadStream, WriteStream } from 'node:fs';
import which from 'which';

/**
 * FFmpeg version information
 */
export interface FFmpegVersion {
    version: string;
    ffmpegPath: string;
    ffprobePath: string;
}

/**
 * Progress information from FFmpeg
 */
export interface FFmpegProgress {
    frames?: number;
    fps?: number;
    time?: string;
    timemark?: string;
    size?: string;
    bitrate?: string;
    speed?: string;
    percent?: number;
}

/**
 * FFprobe result for media file metadata
 */
export interface FFprobeResult {
    format: {
        duration?: string;
        size?: string;
        bit_rate?: string;
        [key: string]: unknown;
    };
    streams: Array<{
        width?: number;
        height?: number;
        codec_type?: string;
        duration?: string;
        channels?: number;
        [key: string]: unknown;
    }>;
}

/**
 * Options for running FFmpeg
 */
export interface FFmpegOptions {
    input?: string | ReadStream | Array<string | ReadStream>;
    output?: string | WriteStream;
    inputOptions?: string[];
    outputOptions?: string[];
    overwriteExisting?: boolean;
    cwd?: string;
}

/**
 * Event handlers for FFmpeg execution
 */
export interface FFmpegHandlers {
    onProgress?: (progress: FFmpegProgress) => void;
    onError?: (error: Error) => void;
    onDone?: () => void;
    onStderr?: (data: string) => void;
}

/**
 * Extracts error message from an unknown error type.
 *
 * @param {unknown} error - The error to extract message from
 * @returns {string} Error message string
 */
export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Parses FFmpeg version string from output.
 *
 * @param {string} versionOutput - Raw version output from ffmpeg -version
 * @returns {string} Parsed version or 'unknown' if not found
 */
export function parseFFmpegVersion(versionOutput: string): string {
    const versionMatch = versionOutput.match(/ffmpeg version ([^\s]+)/);
    return versionMatch ? versionMatch[1] : 'unknown';
}

/**
 * Runs a command and captures its stdout.
 *
 * @param {string} command - Path to the command to run
 * @param {string[]} args - Arguments for the command
 * @returns {Promise<string>} Stdout output from the command
 * @throws {Error} If command fails or exits with non-zero code
 */
export async function runCommand(command: string, args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const proc = spawn(command, args);
        let output = '';

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
            }
        });

        proc.on('error', reject);
    });
}

/**
 * Detects FFmpeg and FFprobe installation and returns version information.
 *
 * @returns {Promise<FFmpegVersion>} Version information including paths
 * @throws {Error} If FFmpeg or FFprobe is not found
 */
export async function detectFFmpeg(): Promise<FFmpegVersion> {
    try {
        const ffmpegPath = which.sync('ffmpeg');
        const ffprobePath = which.sync('ffprobe');

        const versionOutput = await runCommand(ffmpegPath, ['-version']);
        const version = parseFFmpegVersion(versionOutput);

        return {
            ffmpegPath,
            ffprobePath,
            version,
        };
    } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`FFmpeg not found. Please install FFmpeg and ensure it's in your PATH. Error: ${message}`);
    }
}

/**
 * Runs ffprobe command and collects output.
 *
 * @param {string} ffprobePath - Path to ffprobe binary
 * @param {string[]} args - Arguments for ffprobe
 * @returns {Promise<string>} JSON output from ffprobe
 * @throws {Error} If ffprobe fails
 */
export async function runFFprobe(ffprobePath: string, args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const proc = spawn(ffprobePath, args);
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`ffprobe failed with code ${code}: ${stderr || 'unknown error'}`));
            }
        });

        proc.on('error', reject);
    });
}

/**
 * Runs ffprobe to get metadata about a media file.
 *
 * @param {string} filePath - Path to the media file
 * @returns {Promise<FFprobeResult>} Metadata about the media file
 * @throws {Error} If ffprobe fails or returns invalid JSON
 */
export async function probe(filePath: string): Promise<FFprobeResult> {
    try {
        const ffprobePath = which.sync('ffprobe');
        const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath];

        const output = await runFFprobe(ffprobePath, args);
        return JSON.parse(output) as FFprobeResult;
    } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Failed to probe file ${filePath}: ${message}`);
    }
}

/**
 * Extracts a numeric value from a regex match.
 *
 * @param {RegExpMatchArray | null} match - Regex match result
 * @param {number} index - Index of the capture group (default: 1)
 * @param {'int' | 'float'} type - Type of number to parse
 * @returns {number | undefined} Parsed number or undefined if no match
 */
export function extractNumber(
    match: RegExpMatchArray | null,
    index = 1,
    type: 'int' | 'float' = 'int',
): number | undefined {
    if (!match) {
        return undefined;
    }
    const value = type === 'int' ? Number.parseInt(match[index], 10) : Number.parseFloat(match[index]);
    return Number.isNaN(value) ? undefined : value;
}

/**
 * Converts time string (HH:MM:SS.MS) to seconds.
 *
 * @param {string} time - Time string in format HH:MM:SS.MS
 * @returns {number} Time in seconds
 */
export function parseTimeToSeconds(time: string): number {
    const parts = time.split(':');
    if (parts.length !== 3) {
        return 0;
    }

    const hours = Number.parseFloat(parts[0]);
    const minutes = Number.parseFloat(parts[1]);
    const seconds = Number.parseFloat(parts[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
        return 0;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parses FFmpeg's progress output from stderr.
 *
 * @param {string} line - A line from FFmpeg's stderr
 * @param {number} [duration] - Total duration in seconds for percent calculation
 * @returns {FFmpegProgress | null} Parsed progress info or null if not a progress line
 */
export function parseProgress(line: string, duration?: number): FFmpegProgress | null {
    // FFmpeg progress lines look like:
    // frame=  123 fps= 45 q=28.0 size=    1024kB time=00:00:05.00 bitrate=1677.7kbits/s speed=1.23x
    if (!line.includes('time=') && !line.includes('frame=')) {
        return null;
    }

    const progress: FFmpegProgress = {};

    // Extract various metrics using regex
    const frameMatch = extractNumber(line.match(/frame=\s*(\d+)/), 1, 'int');
    if (frameMatch !== undefined) {
        progress.frames = frameMatch;
    }

    const fpsMatch = extractNumber(line.match(/fps=\s*([\d.]+)/), 1, 'float');
    if (fpsMatch !== undefined) {
        progress.fps = fpsMatch;
    }

    const timeMatch = line.match(/time=(\S+)/);
    if (timeMatch) {
        progress.time = timeMatch[1];
        progress.timemark = timeMatch[1];

        // Calculate percent if we have duration
        if (duration) {
            const timeInSeconds = parseTimeToSeconds(timeMatch[1]);
            progress.percent = Math.min(100, (timeInSeconds / duration) * 100);
        }
    }

    const sizeMatch = line.match(/size=\s*(\S+)/);
    if (sizeMatch) {
        progress.size = sizeMatch[1];
    }

    const bitrateMatch = line.match(/bitrate=\s*(\S+)/);
    if (bitrateMatch) {
        progress.bitrate = bitrateMatch[1];
    }

    const speedMatch = line.match(/speed=\s*(\S+)/);
    if (speedMatch) {
        progress.speed = speedMatch[1];
    }

    return progress;
}

/**
 * Extracts duration from FFmpeg's stderr output.
 *
 * @param {string} line - A line from FFmpeg's stderr
 * @returns {number | undefined} Duration in seconds or undefined if not found
 */
export function extractDuration(line: string): number | undefined {
    const durationMatch = line.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (!durationMatch) {
        return undefined;
    }

    const hours = Number.parseInt(durationMatch[1], 10);
    const minutes = Number.parseInt(durationMatch[2], 10);
    const seconds = Number.parseFloat(durationMatch[3]);

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Builds FFmpeg arguments array from options.
 *
 * @param {FFmpegOptions} options - FFmpeg options
 * @returns {string[]} Array of command-line arguments
 */
export function buildFFmpegArgs(options: FFmpegOptions): string[] {
    const args: string[] = [];

    // Global options
    args.push('-hide_banner');
    if (options.overwriteExisting !== false) {
        args.push('-y');
    }

    // Input options
    if (options.inputOptions) {
        args.push(...options.inputOptions);
    }

    // Handle multiple inputs
    const inputs = Array.isArray(options.input) ? options.input : [options.input];
    for (const input of inputs) {
        args.push('-i');
        if (typeof input === 'string') {
            args.push(input);
        } else {
            args.push('pipe:0'); // stdin
        }
    }

    // Output options
    if (options.outputOptions) {
        args.push(...options.outputOptions);
    }

    // Output
    if (typeof options.output === 'string') {
        args.push(options.output);
    } else {
        args.push('pipe:1'); // stdout
    }

    return args;
}

/**
 * Sets up input stream piping to FFmpeg process.
 *
 * @param {FFmpegOptions} options - FFmpeg options
 * @param {ChildProcessWithoutNullStreams} proc - Child process to pipe to
 */
export function setupInputStream(options: FFmpegOptions, proc: ChildProcessWithoutNullStreams): void {
    // Handle input stream (only for single non-string input)
    if (options.input && !Array.isArray(options.input) && typeof options.input !== 'string') {
        options.input.pipe(proc.stdin);
    }
}

/**
 * Sets up output stream piping from FFmpeg process.
 *
 * @param {FFmpegOptions} options - FFmpeg options
 * @param {ChildProcessWithoutNullStreams} proc - Child process to pipe from
 */
export function setupOutputStream(options: FFmpegOptions, proc: ChildProcessWithoutNullStreams): void {
    if (options.output && typeof options.output !== 'string') {
        proc.stdout.pipe(options.output);
    }
}

/**
 * Handles stderr data from FFmpeg process.
 *
 * @param {Buffer} data - Stderr data buffer
 * @param {string[]} stderrBuffer - Accumulator for stderr output
 * @param {{ duration?: number }} state - Mutable state object
 * @param {FFmpegHandlers} [handlers] - Event handlers
 */
export function handleStderr(
    data: Buffer,
    stderrBuffer: string[],
    state: { duration?: number },
    handlers?: FFmpegHandlers,
): void {
    const lines = data.toString();
    stderrBuffer.push(lines);

    // Call custom stderr handler if provided
    if (handlers?.onStderr) {
        handlers.onStderr(lines);
    }

    // Try to extract duration from early output
    if (!state.duration) {
        const duration = extractDuration(lines);
        if (duration !== undefined) {
            state.duration = duration;
        }
    }

    // Parse progress
    if (handlers?.onProgress) {
        for (const line of lines.split('\n')) {
            const progress = parseProgress(line.trim(), state.duration);
            if (progress) {
                handlers.onProgress(progress);
            }
        }
    }
}

/**
 * Handles process close event.
 *
 * @param {number | null} code - Exit code
 * @param {string} stderrOutput - Accumulated stderr output
 * @param {FFmpegHandlers} [handlers] - Event handlers
 * @param {() => void} resolve - Promise resolve function
 * @param {(reason: Error) => void} reject - Promise reject function
 */
export function handleProcessClose(
    code: number | null,
    stderrOutput: string,
    handlers: FFmpegHandlers | undefined,
    resolve: () => void,
    reject: (reason: Error) => void,
): void {
    if (code === 0) {
        if (handlers?.onDone) {
            handlers.onDone();
        }
        resolve();
    } else {
        const error = new Error(`FFmpeg exited with code ${code}${stderrOutput ? `\n${stderrOutput}` : ''}`);
        if (handlers?.onError) {
            handlers.onError(error);
        }
        reject(error);
    }
}

/**
 * Handles process error event.
 *
 * @param {Error} error - Error from process
 * @param {FFmpegHandlers} [handlers] - Event handlers
 * @param {(reason: Error) => void} reject - Promise reject function
 */
export function handleProcessError(
    error: Error,
    handlers: FFmpegHandlers | undefined,
    reject: (reason: Error) => void,
): void {
    if (handlers?.onError) {
        handlers.onError(error);
    }
    reject(error);
}

/**
 * Executes FFmpeg with the given options and handlers.
 *
 * @param {FFmpegOptions} options - FFmpeg execution options
 * @param {FFmpegHandlers} [handlers] - Event handlers for progress, errors, etc.
 * @returns {Promise<void>} Resolves when FFmpeg completes successfully
 * @throws {Error} If FFmpeg execution fails
 */
export async function runFFmpeg(options: FFmpegOptions, handlers?: FFmpegHandlers): Promise<void> {
    const ffmpegPath = which.sync('ffmpeg');
    const args = buildFFmpegArgs(options);

    return new Promise<void>((resolve, reject) => {
        const proc: ChildProcessWithoutNullStreams = spawn(ffmpegPath, args, {
            cwd: options.cwd,
        });

        const stderrBuffer: string[] = [];
        const state: { duration?: number } = {};

        setupInputStream(options, proc);
        setupOutputStream(options, proc);

        proc.stderr.on('data', (data: Buffer) => {
            handleStderr(data, stderrBuffer, state, handlers);
        });

        proc.on('close', (code) => {
            handleProcessClose(code, stderrBuffer.join(''), handlers, resolve, reject);
        });

        proc.on('error', (error) => {
            handleProcessError(error, handlers, reject);
        });
    });
}
