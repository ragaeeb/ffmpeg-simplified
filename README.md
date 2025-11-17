# ffmpeg-simplified

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/85351d0a-8696-4af7-9b7a-ff95ace66306.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/85351d0a-8696-4af7-9b7a-ff95ace66306)
[![Node.js CI](https://github.com/ragaeeb/ffmpeg-simplified/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/ffmpeg-simplified/actions/workflows/build.yml)
![GitHub License](https://img.shields.io/github/license/ragaeeb/ffmpeg-simplified)
![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/ffmpeg-simplified)
[![codecov](https://codecov.io/gh/ragaeeb/ffmpeg-simplified/graph/badge.svg?token=6B40XM3HNB)](https://codecov.io/gh/ragaeeb/ffmpeg-simplified)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)
[![Size](https://deno.bundlejs.com/badge?q=ffmpeg-simplified@latest&badge=detailed)](https://bundlejs.com/?q=ffmpeg-simplified%40latest)
![bun](https://img.shields.io/badge/runtime-bun-%23000000)

`ffmpeg-simplified` is a batteries-included toolkit that provides a simple, ergonomic Promise-based API for everyday audio and video automation tasks. It directly wraps your locally installed `ffmpeg` binary without any intermediate dependencies.

## Features

- ✅ **Zero external wrapper dependencies** - Direct FFmpeg integration with no third-party wrappers to maintain
- ✅ **Zero-configuration** - Automatic detection of system-installed `ffmpeg` and `ffprobe` binaries
- ✅ **Comprehensive workflows** - Noise reduction, slicing, merging, frame capture, audio swapping, audio syncing and more
- ✅ **TypeScript-native** - Rich type definitions and detailed JSDoc comments for every function
- ✅ **Modern runtimes** - Ships prebuilt bundles via [`tsdown`](https://github.com/privatenumber/tsdown) targeting Node ≥22 and Bun ≥1.0
- ✅ **Battle-tested** - Test suite powered by [`bun test`](https://bun.sh/docs/test) with real media fixtures

## Requirements

- Node.js ≥ **22.0.0** or Bun ≥ **1.0**
- A working `ffmpeg` installation available on your `PATH`

The package automatically detects system-installed `ffmpeg` and `ffprobe` binaries using the `which` utility. We intentionally avoid bundling `ffmpeg-static` so you can manage codecs and updates yourself.

### Custom FFmpeg Wrapper

The library includes a lightweight custom wrapper (`src/vendor/ffmpeg.ts`) tailored specifically for this package's use cases:

- **Direct process spawning** - No argument parsing issues with complex filter chains
- **Progress tracking** - Parses FFmpeg's stderr for real-time progress events
- **Stream support** - Handles Node.js ReadStream/WriteStream for piped I/O
- **FFprobe integration** - Built-in JSON parsing of media metadata
- **Error handling** - Robust stderr capture and error reporting
- **Version detection** - Automatically detects FFmpeg installation and version

This approach eliminates dependency on external wrappers while providing a clean, maintainable implementation focused on our specific needs.

## Installation

Install with your preferred package manager:

```bash
bun add ffmpeg-simplified
# or
npm install ffmpeg-simplified
# or
yarn add ffmpeg-simplified
```

## Quick start

```ts
import {
  delayAudio,
  detectSilences,
  formatMedia,
  getFrames,
  getMediaDuration,
  getVideoDimensions,
  mergeSlices,
  replaceAudio,
  slice,
  sliceAndMerge,
  splitFileOnSilences,
  type Logger,
} from "ffmpeg-simplified";

const duration = await getMediaDuration("./samples/interview.mp4");
const silences = await detectSilences("./samples/interview.wav", {
  silenceThreshold: -45,
  silenceDuration: 0.3,
});
await formatMedia("./samples/interview.wav", "./output/clean.wav", {
  fast: true,
  noiseReduction: { dialogueEnhance: true },
});
await delayAudio("./samples/video.mp4", "./output/synced.mp4", 0.5);
```

### Custom logging

Most functions accept an optional `logger` parameter that conforms to the `Logger` interface (compatible with `console` and popular logging libraries):

```ts
import type { Logger } from "ffmpeg-simplified";

// Use the built-in console
await formatMedia(input, output, options, callbacks, console);

// Or your own logger (pino, winston, etc.)
import pino from "pino";
const logger = pino();
await sliceAndMerge(input, output, options, logger);

// Minimal custom logger
const customLogger: Logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
};
await splitFileOnSilences(file, outputDir, options, callbacks, customLogger);
```

The `Logger` interface is simple and all methods are optional:

```ts
interface Logger {
  info?: (message: string, ...args: any[]) => void;
  debug?: (message: string, ...args: any[]) => void;
  warn?: (message: string, ...args: any[]) => void;
  error?: (message: string, ...args: any[]) => void;
}
```

## API overview

### `delayAudio(inputFile, outputFile, delayInSeconds, logger?)`
Adjusts audio synchronization in a video by applying a delay (positive) or advance (negative) to the audio track.

### `detectSilences(filePath, options)`
Finds quiet sections in an audio file using `silencedetect`.

### `formatMedia(input, outputPath, options?, callbacks?, logger?)`
Preprocess audio streams (noise reduction, mono downmixing, fast mode, callback hooks).

### `getMediaDuration(filePath)` / `getVideoDimensions(filePath)`
Lightweight wrappers around `ffprobe` for duration and resolution metadata.

### `splitFileOnSilences(filePath, outputDir, options?, callbacks?, logger?)`
Chunk long-form audio into natural speaking segments and normalizes short clips.

### `slice(filePath, options, logger?)` / `sliceAndMerge(filePath, outputFile, options, logger?)`
Slice videos by absolute timestamps or human-friendly timecodes, then optionally merge back together.

### `mergeSlices(inputFiles, outputFile, options?, logger?)`
Concat arbitrary files using the efficient concat demuxer.

### `replaceAudio(videoFile, audioFile, outputFile, logger?)`
Swap a video's audio track without re-encoding the video stream.

### `getFrames(videoFile, options, logger?)`
Extract thumbnails at a fixed cadence with optional cropping and preprocessing presets.

Refer to the inline JSDoc comments for parameter details and return types—every exported function documents accepted options and callback hooks.

## Development

Install dependencies and run the toolchain with Bun:

```bash
bun install
bun run build
bun test
```

- **Builds** are handled by `tsdown`, producing ESM output and declaration files in `dist/`.
- **Tests** rely on Bun's native test runner and preload `setupTests.ts` to expose fixture paths (`testing/sample.*`). The suite exercises real audio/video transformations, so ensure `ffmpeg` and `ffprobe` binaries are reachable.

## Contributing

1. Fork the repo and create a feature branch.
2. Install dependencies with `bun install`.
3. Run `bun test` and `bun run build` before submitting a pull request.

## License

MIT © Ragaeeb Haq
