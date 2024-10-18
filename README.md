[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/e8859a7e-7cfc-4447-a7c0-965229145506.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/e8859a7e-7cfc-4447-a7c0-965229145506) [![Node.js CI](https://github.com/ragaeeb/ffmpeg-simple/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/ffmpeg-simple/actions/workflows/build.yml) ![GitHub License](https://img.shields.io/github/license/ragaeeb/ffmpeg-simple) ![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/ffmpeg-simple) [![codecov](https://codecov.io/gh/ragaeeb/ffmpeg-simple/graph/badge.svg?token=6B40XM3HNB)](https://codecov.io/gh/ragaeeb/ffmpeg-simple) [![Size](https://deno.bundlejs.com/badge?q=ffmpeg-simple@1.0.0)](https://bundlejs.com/?q=ffmpeg-simple%401.0.0) ![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue) ![npm](https://img.shields.io/npm/v/ffmpeg-simple) ![npm](https://img.shields.io/npm/dm/ffmpeg-simple) ![GitHub issues](https://img.shields.io/github/issues/ragaeeb/ffmpeg-simple) ![GitHub stars](https://img.shields.io/github/stars/ragaeeb/ffmpeg-simple?style=social)

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=bugs)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)

# ffmpeg-simple

`ffmpeg-simple` is a simple wrapper around `ffmpeg` designed to simplify common audio and video processing tasks through easy-to-use APIs.

## Installation

To install ffmpeg-simple, use npm or yarn:

```bash
npm install ffmpeg-simple
# or
yarn add ffmpeg-simple
# or
pnpm i ffmpeg-simple
```

## Requirements

Node.js >= `20.0.0`

Ensure you have `ffmpeg` installed. If not, you can use the `ffmpeg-static` package, which is already included as a dependency.

## Usage

The SDK provides several functions to interact with the turath.io API. Below are the main functions that you can use:

### Importing the SDK

```javascript
import {
  sliceAndMerge,
  slice,
  mergeSlices,
  splitFileOnSilences,
  replaceAudio,
  formatMedia,
  detectSilences,
  getMediaDuration,
} from "ffmpeg-simple";
```

### detectSilences

Detects silences in an audio file based on specified threshold and duration.

```javascript
const silences = await detectSilences("audio.mp3", {
  silenceDuration: 0.5,
  silenceThreshold: -50,
});
```

Parameters:

- filePath (string): Path to the input audio file.
- options (SilenceDetectionOptions): Silence detection options.

Returns:

- Promise<TimeRange[]>: Array of time ranges where silence was detected.

### formatMedia

Preprocesses a media file with options like noise reduction and format conversion.

```javascript
await formatMedia("input.wav", "./output", {
  noiseReduction: {
    highpass: 200,
    lowpass: 3000,
    dialogueEnhance: true,
  },
});
```

Parameters:

- input (Readable | string): Input stream or file path.
- outputDir (string): Directory where the processed file will be saved.
- options (PreprocessOptions, optional): Preprocessing options.
- callbacks (PreprocessingCallbacks, optional): Callback functions for progress tracking.

Returns:

- Promise<string>: Path to the processed media file.

### getMediaDuration

Retrieves the duration of a media file in seconds.

```javascript
const duration = await getMediaDuration("video.mp4");
console.log(`Duration: ${duration} seconds`);
```

Parameters:

- filePath (string): Path to the media file.

Returns:

Promise<number>: Duration of the media file in seconds.

### mergeSlices

Merges multiple media files into a single file.

```javascript
await mergeSlices(["slice1.mp4", "slice2.mp4"], "mergedOutput.mp4");
```

Parameters:

- inputFiles (string[]): Array of media file paths to merge.
- outputFile (string): Path where the merged file will be saved.

Returns:

- Promise<string>: Path to the merged output file.

### replaceAudio

Replaces the audio track of a video file with a new audio file.

```javascript
await replaceAudio("video.mp4", "newAudio.mp3", "outputVideo.mp4");
```

Parameters:

- videoFile (string): Path to the input video file.
- audioFile (string): Path to the new audio file.
- outputFile (string): Path where the output video will be saved.

Returns:

Promise<string>: Path to the output video file.

### slice

Slices a media file into multiple parts based on specified time ranges.

```javascript
const slices = await slice("input.mp4", {
  ranges: [
    { start: 0, end: 60 },
    { start: 120, end: 180 },
  ],
  outputFolder: "./slices",
});

console.log(slices); // ["./slices/input_0.mp4", "./slices/input_1.mp4"]
```

Parameters:

- file (string): Path to the input media file.
- options (SliceOptions): Options containing the time ranges and output folder.

Returns:

- Promise<string[]>: Array of paths to the sliced files.

### sliceAndMerge

Slices a media file based on specified time ranges and merges the slices into a single file.

```javascript
await sliceAndMerge("input.mp4", "output.mp4", {
  ranges: [
    { start: 0, end: 60 },
    { start: 120, end: 180 },
  ],
});
```

Parameters:

- inputFile (string): Path to the input media file.
- outputFile (string): Path where the output file will be saved.
- options (SliceAndMergeOptions): Options containing the time ranges.

Returns:

- Promise<string>: Path to the merged output file.

### splitFileOnSilences

Splits an audio file into chunks based on silence detection.

```javascript
const chunks = await splitFileOnSilences("audio.mp3", "./chunks", {
  chunkDuration: 60,
  silenceDetection: {
    silenceDuration: 0.5,
    silenceThreshold: -50,
  },
});
```

Parameters:

- filePath (string): Path to the input audio file.
- outputDir (string): Directory where the chunks will be saved.
- options (SplitOptions, optional): Split options.
- callbacks (SplitOnSilenceCallbacks, optional): Callback functions for progress tracking.

Returns:

- Promise<AudioChunk[]>: Array of audio chunks with file names and time ranges.

## Contributing

If you'd like to contribute to the SDK, feel free to fork the repository and submit a pull request. Contributions are welcome!

## License

This SDK is licensed under the MIT License.
