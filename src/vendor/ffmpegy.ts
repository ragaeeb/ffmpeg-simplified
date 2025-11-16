import { EventEmitter } from "node:events";
import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import { spawn, execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE_BIN = process.env.FFPROBE_PATH || "ffprobe";

const OPTION_TOKENIZER = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;

const tokenizeOptions = (options: string[]): string[] => {
  return options.flatMap((option) => {
    const matches = option.match(OPTION_TOKENIZER);
    if (!matches) return [];
    return matches.map((match) => match.replace(/^"|"$/g, "").replace(/^'|'$/g, ""));
  });
};

const parseTimemarkSeconds = (timemark: string): number => {
  const parts = timemark.split(":").map((part) => parseFloat(part));
  if (parts.length === 0 || parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  while (parts.length < 3) {
    parts.unshift(0);
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

export interface FFprobeStream {
  [key: string]: unknown;
}

export interface FFprobeMetadata {
  format: {
    duration?: number;
    [key: string]: unknown;
  };
  streams: FFprobeStream[];
}

export interface ProgressUpdate {
  percent?: number;
  timemark?: string;
}

type InputSource = string | Readable;

class FfmpegyCommand extends EventEmitter {
  private inputs: InputSource[] = [];

  private inputArgs: string[] = [];

  private outputArgs: string[] = [];

  private audioFilterExpressions: string[] = [];

  private audioChannelCount?: number;

  private outputPath?: string;

  private startTime?: number | string;

  private duration?: number | string;

  private tempFiles: string[] = [];

  private started = false;

  constructor(initialInput?: InputSource) {
    super();
    if (initialInput) {
      this.inputs.push(initialInput);
    }
  }

  input(source: InputSource): this {
    this.inputs.push(source);
    return this;
  }

  inputOptions(options: string[]): this {
    this.inputArgs.push(...tokenizeOptions(options));
    return this;
  }

  outputOptions(options: string[]): this {
    this.outputArgs.push(...tokenizeOptions(options));
    return this;
  }

  audioFilters(filters: string | string[]): this {
    const values = Array.isArray(filters) ? filters : [filters];
    this.audioFilterExpressions.push(
      ...values.filter(Boolean).map((filter) => filter as string)
    );
    return this;
  }

  audioChannels(count: number): this {
    this.audioChannelCount = count;
    return this;
  }

  setStartTime(start: number | string): this {
    this.startTime = start;
    return this;
  }

  setDuration(duration: number | string): this {
    this.duration = duration;
    return this;
  }

  output(filePath: string): this {
    this.outputPath = filePath;
    return this;
  }

  save(filePath: string): this {
    this.output(filePath);
    return this.run();
  }

  run(): this {
    if (this.started) {
      return this;
    }

    this.started = true;
    void this.execute();
    return this;
  }

  private async execute() {
    try {
      const resolvedInputs = await this.prepareInputs();
      if (resolvedInputs.length === 0) {
        throw new Error("ffmpegy: No inputs specified");
      }
      if (!this.outputPath) {
        throw new Error("ffmpegy: No output specified");
      }

      const args = this.buildArgs(resolvedInputs, this.outputPath);
      const child = spawn(FFMPEG_BIN, args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderrBuffer = "";

      this.emit("progress", { percent: 0 } satisfies ProgressUpdate);

      child.stderr?.setEncoding("utf-8");
      child.stderr?.on("data", (chunk: string) => {
        stderrBuffer += chunk;
        const lines = stderrBuffer.split(/\r?\n/);
        stderrBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          this.emit("stderr", line);
          const match = line.match(/time=([0-9:\.]+)/);
          if (match) {
            const timemark = match[1];
            const seconds = parseTimemarkSeconds(timemark);
            const percentValue =
              typeof this.duration === "number"
                ? Math.min(100, (seconds / this.duration) * 100)
                : undefined;
            this.emit("progress", { percent: percentValue, timemark });
          }
        }
      });

      child.on("error", (err) => {
        this.emit("error", err);
      });

      child.on("close", async (code) => {
        await this.cleanup();
        if (code === 0) {
          this.emit("progress", { percent: 100 });
          this.emit("end");
        } else {
          this.emit(
            "error",
            new Error(`ffmpegy: ffmpeg exited with code ${code ?? "unknown"}`)
          );
        }
      });
    } catch (error) {
      await this.cleanup();
      this.emit("error", error as Error);
    }
  }

  private async prepareInputs(): Promise<string[]> {
    const resolved: string[] = [];

    for (const input of this.inputs) {
      if (typeof input === "string") {
        resolved.push(input);
        continue;
      }

      const tempFile = path.join(os.tmpdir(), `ffmpegy-${randomUUID()}`);
      await pipeline(input, createWriteStream(tempFile));
      this.tempFiles.push(tempFile);
      resolved.push(tempFile);
    }

    return resolved;
  }

  private buildArgs(inputs: string[], outputPath: string): string[] {
    const args: string[] = ["-y", "-hide_banner"];

    if (this.startTime !== undefined) {
      args.push("-ss", String(this.startTime));
    }

    if (inputs.length === 0) {
      throw new Error("ffmpegy: No inputs provided");
    }

    inputs.forEach((input, index) => {
      if (index === 0 && this.inputArgs.length > 0) {
        args.push(...this.inputArgs);
      }

      args.push("-i", input);
    });

    if (this.duration !== undefined) {
      args.push("-t", String(this.duration));
    }

    if (this.audioChannelCount !== undefined) {
      args.push("-ac", this.audioChannelCount.toString());
    }

    if (this.audioFilterExpressions.length > 0) {
      args.push("-af", this.audioFilterExpressions.join(","));
    }

    if (this.outputArgs.length > 0) {
      args.push(...this.outputArgs);
    }

    args.push(outputPath);
    return args;
  }

  private async cleanup() {
    if (this.tempFiles.length === 0) {
      return;
    }

    await Promise.all(
      this.tempFiles.map((file) =>
        fs.rm(file, { force: true }).catch(() => {
          // ignore cleanup errors
        })
      )
    );

    this.tempFiles = [];
  }
}

interface FfmpegFactory {
  (input?: InputSource): FfmpegyCommand;
  prototype: FfmpegyCommand;
  ffprobe(
    filePath: string,
    callback: (err: Error | null, metadata?: FFprobeMetadata) => void
  ): void;
}

const ffmpeg = ((input?: InputSource) => new FfmpegyCommand(input)) as FfmpegFactory;

ffmpeg.prototype = FfmpegyCommand.prototype;

ffmpeg.ffprobe = (filePath, callback) => {
  execFile(
    FFPROBE_BIN,
    ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", filePath],
    (error, stdout) => {
      if (error) {
        callback(error);
        return;
      }

      try {
        const metadata = JSON.parse(stdout) as FFprobeMetadata;
        callback(null, metadata);
      } catch (parseError) {
        callback(parseError as Error);
      }
    }
  );
};

export type { FfmpegyCommand };

export default ffmpeg;
