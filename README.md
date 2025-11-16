# ffmpeg-simplified

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/85351d0a-8696-4af7-9b7a-ff95ace66306.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/85351d0a-8696-4af7-9b7a-ff95ace66306)
[![Node.js CI](https://github.com/ragaeeb/ffmpeg-simplified/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/ffmpeg-simplified/actions/workflows/build.yml)
![GitHub License](https://img.shields.io/github/license/ragaeeb/ffmpeg-simplified)
![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/ffmpeg-simplified)
[![codecov](https://codecov.io/gh/ragaeeb/ffmpeg-simplified/graph/badge.svg?token=6B40XM3HNB)](https://codecov.io/gh/ragaeeb/ffmpeg-simplified)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)
![bun](https://img.shields.io/badge/runtime-bun-%23000000)

`ffmpeg-simplified` is a batteries-included toolkit around the in-repo [`ffmpegy`](src/vendor/ffmpegy.ts) bindings. It exposes an ergonomic, Promise-based API for everyday audio and video automation tasks while leaning on your locally installed `ffmpeg` binary.

## Features

- ✅ Zero-configuration access to common `ffmpeg` workflows (noise reduction, slicing, merging, frame capture, audio swapping and more).
- ✅ Written in TypeScript with rich type definitions and detailed JSDoc comments for every function.
- ✅ Ships prebuilt bundles via [`tsdown`](https://github.com/privatenumber/tsdown) and targets modern Node/Bun runtimes.
- ✅ Test suite powered by [`bun test`](https://bun.sh/docs/test) and real media fixtures to ensure behaviour parity with `ffmpeg`.

## Requirements

- Node.js ≥ **22.0.0** or Bun ≥ **1.0**.
- A working `ffmpeg` installation available on your `PATH`. The package intentionally avoids bundling `ffmpeg-static` so that you can manage codecs and updates yourself.
- Optional: set `FFMPEG_PATH` and/or `FFPROBE_PATH` environment variables if the binaries live somewhere other than your shell `PATH`.

### Built-in `ffmpegy`

The [`src/vendor/ffmpegy.ts`](src/vendor/ffmpegy.ts) helper is a minimal event-driven wrapper that shells out to the locally installed `ffmpeg` and `ffprobe` executables. It mimics the small Fluent-FFmpeg subset that this project relied on—methods such as `audioFilters`, `inputOptions`, `setStartTime`, `setDuration` and event hooks like `progress`, `stderr`, `end`, and `error` all behave the same. The helper also:

- Streams `Readable` inputs into temporary files and cleans them up automatically.
- Emits deterministic progress callbacks (including a final 100% event) so callbacks fire even on short clips.
- Allows overriding the binary paths via `FFMPEG_PATH`/`FFPROBE_PATH` for custom installations.

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
```

## API overview

### `detectSilences(filePath, options)`
Finds quiet sections in an audio file using `silencedetect`.

### `formatMedia(input, outputPath, options?, callbacks?)`
Preprocess audio streams (noise reduction, mono downmixing, fast mode, callback hooks).

### `getMediaDuration(filePath)` / `getVideoDimensions(filePath)`
Lightweight wrappers around `ffprobe` for duration and resolution metadata.

### `splitFileOnSilences(filePath, outputDir, options?, callbacks?)`
Chunk long-form audio into natural speaking segments and normalises short clips.

### `slice(filePath, options)` / `sliceAndMerge(filePath, outputFile, options)`
Slice videos by absolute timestamps or human-friendly timecodes, then optionally merge back together.

### `mergeSlices(inputFiles, outputFile, options?)`
Concat arbitrary files using the efficient concat demuxer.

### `replaceAudio(videoFile, audioFile, outputFile)`
Swap a video's audio track without re-encoding the video stream.

### `getFrames(videoFile, options)`
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
