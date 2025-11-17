import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { FFmpegHandlers, FFmpegOptions } from "./ffmpeg";
import {
	buildFFmpegArgs,
	extractDuration,
	extractNumber,
	getErrorMessage,
	handleProcessClose,
	handleProcessError,
	handleStderr,
	parseFFmpegVersion,
	parseProgress,
	parseTimeToSeconds,
	setupInputStream,
	setupOutputStream,
} from "./ffmpeg";

describe("ffmpeg utilities", () => {
	describe("getErrorMessage", () => {
		it("should extract message from Error object", () => {
			const error = new Error("Test error");
			expect(getErrorMessage(error)).toBe("Test error");
		});

		it("should convert string to string", () => {
			expect(getErrorMessage("String error")).toBe("String error");
		});

		it("should convert number to string", () => {
			expect(getErrorMessage(42)).toBe("42");
		});

		it("should convert object to string", () => {
			expect(getErrorMessage({ foo: "bar" })).toBe("[object Object]");
		});
	});

	describe("parseFFmpegVersion", () => {
		it("should parse version from ffmpeg output", () => {
			const output = "ffmpeg version 6.0 Copyright (c) 2000-2023";
			expect(parseFFmpegVersion(output)).toBe("6.0");
		});

		it("should parse version with additional text", () => {
			const output = "ffmpeg version 5.1.2-static https://johnvansickle.com/ffmpeg/";
			expect(parseFFmpegVersion(output)).toBe("5.1.2-static");
		});

		it("should return unknown if version not found", () => {
			const output = "some random output";
			expect(parseFFmpegVersion(output)).toBe("unknown");
		});

		it("should handle empty string", () => {
			expect(parseFFmpegVersion("")).toBe("unknown");
		});
	});

	describe("extractNumber", () => {
		it("should extract integer from match", () => {
			const match = "frame=  123".match(/frame=\s*(\d+)/);
			expect(extractNumber(match, 1, "int")).toBe(123);
		});

		it("should extract float from match", () => {
			const match = "fps= 29.97".match(/fps=\s*([\d.]+)/);
			expect(extractNumber(match, 1, "float")).toBe(29.97);
		});

		it("should return undefined for null match", () => {
			expect(extractNumber(null)).toBeUndefined();
		});

		it("should return undefined for invalid number", () => {
			const match = ["invalid", "NaN"];
			expect(extractNumber(match as any)).toBeUndefined();
		});

		it("should use default index 1", () => {
			const match = "value=42".match(/value=(\d+)/);
			expect(extractNumber(match)).toBe(42);
		});
	});

	describe("parseTimeToSeconds", () => {
		it("should parse HH:MM:SS format", () => {
			expect(parseTimeToSeconds("01:30:45")).toBe(5445);
		});

		it("should parse time with milliseconds", () => {
			expect(parseTimeToSeconds("00:00:10.50")).toBe(10.5);
		});

		it("should handle zero time", () => {
			expect(parseTimeToSeconds("00:00:00")).toBe(0);
		});

		it("should return 0 for invalid format (missing colons)", () => {
			expect(parseTimeToSeconds("12345")).toBe(0);
		});

		it("should return 0 for invalid format (too many parts)", () => {
			expect(parseTimeToSeconds("01:02:03:04")).toBe(0);
		});

		it("should return 0 for non-numeric values", () => {
			expect(parseTimeToSeconds("aa:bb:cc")).toBe(0);
		});

		it("should handle large hour values", () => {
			expect(parseTimeToSeconds("10:30:15")).toBe(37815);
		});
	});

	describe("extractDuration", () => {
		it("should extract duration from ffmpeg output", () => {
			const line = "  Duration: 00:05:30.25, start: 0.000000, bitrate: 1234 kb/s";
			expect(extractDuration(line)).toBe(330.25);
		});

		it("should extract duration with hours", () => {
			const line = "  Duration: 02:15:45.50, start: 0.000000";
			expect(extractDuration(line)).toBe(8145.5);
		});

		it("should return undefined if no duration found", () => {
			const line = "Some other output line";
			expect(extractDuration(line)).toBeUndefined();
		});

		it("should return undefined for empty string", () => {
			expect(extractDuration("")).toBeUndefined();
		});
	});

	describe("parseProgress", () => {
		it("should parse complete progress line", () => {
			const line =
				"frame=  123 fps= 29.97 q=28.0 size=    1024kB time=00:00:05.00 bitrate=1677.7kbits/s speed=1.23x";
			const progress = parseProgress(line);

			expect(progress).toBeDefined();
			expect(progress?.frames).toBe(123);
			expect(progress?.fps).toBe(29.97);
			expect(progress?.time).toBe("00:00:05.00");
			expect(progress?.timemark).toBe("00:00:05.00");
			expect(progress?.size).toBe("1024kB");
			expect(progress?.bitrate).toBe("1677.7kbits/s");
			expect(progress?.speed).toBe("1.23x");
		});

		it("should calculate percent when duration provided", () => {
			const line = "frame=100 time=00:00:05.00 bitrate=1234kbits/s";
			const progress = parseProgress(line, 10); // 10 seconds duration

			expect(progress?.percent).toBe(50);
		});

		it("should cap percent at 100", () => {
			const line = "frame=100 time=00:00:15.00 bitrate=1234kbits/s";
			const progress = parseProgress(line, 10); // 10 seconds duration

			expect(progress?.percent).toBe(100);
		});

		it("should return null for non-progress lines", () => {
			const line = "Input #0, mp4, from 'video.mp4':";
			expect(parseProgress(line)).toBeNull();
		});

		it("should handle partial progress info", () => {
			const line = "frame=50 time=00:00:02.50";
			const progress = parseProgress(line);

			expect(progress?.frames).toBe(50);
			expect(progress?.time).toBe("00:00:02.50");
			expect(progress?.fps).toBeUndefined();
		});
	});

	describe("buildFFmpegArgs", () => {
		it("should build basic args with string input/output", () => {
			const options: FFmpegOptions = {
				input: "input.mp4",
				output: "output.mp4",
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual(["-hide_banner", "-y", "-i", "input.mp4", "output.mp4"]);
		});

		it("should include input options", () => {
			const options: FFmpegOptions = {
				input: "input.mp4",
				output: "output.mp4",
				inputOptions: ["-ss", "10", "-t", "5"],
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual([
				"-hide_banner",
				"-y",
				"-ss",
				"10",
				"-t",
				"5",
				"-i",
				"input.mp4",
				"output.mp4",
			]);
		});

		it("should include output options", () => {
			const options: FFmpegOptions = {
				input: "input.mp4",
				output: "output.mp4",
				outputOptions: ["-c:v", "copy", "-c:a", "aac"],
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual([
				"-hide_banner",
				"-y",
				"-i",
				"input.mp4",
				"-c:v",
				"copy",
				"-c:a",
				"aac",
				"output.mp4",
			]);
		});

		it("should handle multiple inputs", () => {
			const options: FFmpegOptions = {
				input: ["input1.mp4", "input2.mp4"],
				output: "output.mp4",
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual([
				"-hide_banner",
				"-y",
				"-i",
				"input1.mp4",
				"-i",
				"input2.mp4",
				"output.mp4",
			]);
		});

		it("should use pipe:0 for stream input", () => {
			const stream = new PassThrough();
			const options: FFmpegOptions = {
				input: stream,
				output: "output.mp4",
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual(["-hide_banner", "-y", "-i", "pipe:0", "output.mp4"]);
		});

		it("should use pipe:1 for stream output", () => {
			const stream = new PassThrough();
			const options: FFmpegOptions = {
				input: "input.mp4",
				output: stream,
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual(["-hide_banner", "-y", "-i", "input.mp4", "pipe:1"]);
		});

		it("should respect overwriteExisting=false", () => {
			const options: FFmpegOptions = {
				input: "input.mp4",
				output: "output.mp4",
				overwriteExisting: false,
			};

			const args = buildFFmpegArgs(options);

			expect(args).toEqual(["-hide_banner", "-i", "input.mp4", "output.mp4"]);
		});
	});

	describe("setupInputStream", () => {
		it("should pipe stream input to process stdin", () => {
			const inputStream = new PassThrough();
			const mockProc = {
				stdin: new PassThrough(),
			} as unknown as ChildProcessWithoutNullStreams;

			const pipeSpy = mock(() => {});
			inputStream.pipe = pipeSpy;

			const options: FFmpegOptions = {
				input: inputStream,
				output: "output.mp4",
			};

			setupInputStream(options, mockProc);

			expect(pipeSpy).toHaveBeenCalledTimes(1);
		});

		it("should not pipe for string input", () => {
			const mockProc = {
				stdin: new PassThrough(),
			} as unknown as ChildProcessWithoutNullStreams;

			const options: FFmpegOptions = {
				input: "input.mp4",
				output: "output.mp4",
			};

			// Should not throw
			setupInputStream(options, mockProc);
		});

		it("should not pipe for array input", () => {
			const mockProc = {
				stdin: new PassThrough(),
			} as unknown as ChildProcessWithoutNullStreams;

			const options: FFmpegOptions = {
				input: ["input1.mp4", "input2.mp4"],
				output: "output.mp4",
			};

			// Should not throw
			setupInputStream(options, mockProc);
		});
	});

	describe("setupOutputStream", () => {
		it("should pipe process stdout to stream output", () => {
			const outputStream = new PassThrough();
			const mockStdout = new PassThrough();
			const mockProc = {
				stdout: mockStdout,
			} as unknown as ChildProcessWithoutNullStreams;

			const pipeSpy = mock(() => {});
			mockStdout.pipe = pipeSpy;

			const options: FFmpegOptions = {
				input: "input.mp4",
				output: outputStream,
			};

			setupOutputStream(options, mockProc);

			expect(pipeSpy).toHaveBeenCalledTimes(1);
		});

		it("should not pipe for string output", () => {
			const mockProc = {
				stdout: new PassThrough(),
			} as unknown as ChildProcessWithoutNullStreams;

			const options: FFmpegOptions = {
				input: "input.mp4",
				output: "output.mp4",
			};

			// Should not throw
			setupOutputStream(options, mockProc);
		});
	});

	describe("handleStderr", () => {
		it("should accumulate stderr output", () => {
			const data = Buffer.from("Test output\n");
			const stderrBuffer: string[] = [];
			const state = {};

			handleStderr(data, stderrBuffer, state);

			expect(stderrBuffer).toEqual(["Test output\n"]);
		});

		it("should call custom onStderr handler", () => {
			const data = Buffer.from("Test output\n");
			const stderrBuffer: string[] = [];
			const state = {};
			const onStderr = mock(() => {});

			handleStderr(data, stderrBuffer, state, { onStderr });

			expect(onStderr).toHaveBeenCalledWith("Test output\n");
		});

		it("should extract duration from output", () => {
			const data = Buffer.from("Duration: 00:01:30.50, start: 0.000000\n");
			const stderrBuffer: string[] = [];
			const state: { duration?: number } = {};

			handleStderr(data, stderrBuffer, state);

			expect(state.duration).toBe(90.5);
		});

		it("should not overwrite existing duration", () => {
			const data = Buffer.from("Duration: 00:01:30.50, start: 0.000000\n");
			const stderrBuffer: string[] = [];
			const state: { duration?: number } = { duration: 60 };

			handleStderr(data, stderrBuffer, state);

			expect(state.duration).toBe(60);
		});

		it("should call onProgress handler for progress lines", () => {
			const data = Buffer.from("frame=100 time=00:00:05.00 bitrate=1234kbits/s\n");
			const stderrBuffer: string[] = [];
			const state: { duration?: number } = { duration: 10 };
			const onProgress = mock(() => {});

			handleStderr(data, stderrBuffer, state, { onProgress });

			expect(onProgress).toHaveBeenCalledTimes(1);
			expect(onProgress).toHaveBeenCalledWith({
				frames: 100,
				time: "00:00:05.00",
				timemark: "00:00:05.00",
				bitrate: "1234kbits/s",
				percent: 50,
			});
		});

		it("should handle multiple progress lines", () => {
			const data = Buffer.from(
				"frame=100 time=00:00:05.00\nframe=200 time=00:00:10.00\n",
			);
			const stderrBuffer: string[] = [];
			const state: { duration?: number } = {};
			const onProgress = mock(() => {});

			handleStderr(data, stderrBuffer, state, { onProgress });

			expect(onProgress).toHaveBeenCalledTimes(2);
		});
	});

	describe("handleProcessClose", () => {
		it("should resolve on success (code 0)", () => {
			const resolve = mock(() => {});
			const reject = mock(() => {});
			const onDone = mock(() => {});

			handleProcessClose(0, "", { onDone }, resolve, reject);

			expect(onDone).toHaveBeenCalledTimes(1);
			expect(resolve).toHaveBeenCalledTimes(1);
			expect(reject).not.toHaveBeenCalled();
		});

		it("should reject on failure (non-zero code)", () => {
			const resolve = mock(() => {});
			const reject = mock(() => {});
			const onError = mock(() => {});

			handleProcessClose(1, "Error output", { onError }, resolve, reject);

			expect(onError).toHaveBeenCalledTimes(1);
			expect(reject).toHaveBeenCalledTimes(1);
			expect(resolve).not.toHaveBeenCalled();

			const error = reject.mock.calls[0][0] as Error;
			expect(error.message).toContain("FFmpeg exited with code 1");
			expect(error.message).toContain("Error output");
		});

		it("should work without handlers", () => {
			const resolve = mock(() => {});
			const reject = mock(() => {});

			handleProcessClose(0, "", undefined, resolve, reject);

			expect(resolve).toHaveBeenCalledTimes(1);
		});

		it("should handle null exit code as failure", () => {
			const resolve = mock(() => {});
			const reject = mock(() => {});

			handleProcessClose(null, "", undefined, resolve, reject);

			expect(reject).toHaveBeenCalledTimes(1);
		});
	});

	describe("handleProcessError", () => {
		it("should call onError handler", () => {
			const error = new Error("Process error");
			const reject = mock(() => {});
			const onError = mock(() => {});

			handleProcessError(error, { onError }, reject);

			expect(onError).toHaveBeenCalledWith(error);
			expect(reject).toHaveBeenCalledWith(error);
		});

		it("should work without handlers", () => {
			const error = new Error("Process error");
			const reject = mock(() => {});

			handleProcessError(error, undefined, reject);

			expect(reject).toHaveBeenCalledWith(error);
		});
	});
});

