# Agent guidelines

## Tooling & workflows
- Use **Bun** commands for dependency management (`bun install`, `bun update`, `bun add`, etc.).
- Build artifacts with `bun run build` (tsdown) and run the suite with `bun test`.
- Always keep the tooling on the latest released versions: run `bun update --latest` after touching `package.json`.
- Tests rely on `testing/sample.*` fixtures that are wired up through `setupTests.ts` via the preload configuration in `bunfig.toml`.
- Changes that affect behaviour must be reflected in `README.md`.

## Repository map
- `src/functions/` houses the public API. Each function should stay small, composable, and fully JSDoc'd.
- `src/vendor/ffmpeg.ts` is our custom FFmpeg wrapper that directly spawns `ffmpeg`/`ffprobe` processes using Node's `child_process`.
- `src/utils/` contains reusable helpers (IO, cropping, preprocessing filters).
- `testing/` stores real media fixtures; avoid renaming without adjusting `setupTests.ts`.

## Coding conventions
- Keep the code TypeScript-strict, prefer async/await and ES module syntax.
- Maintain comprehensive JSDoc comments for every exported function and surface important parameter defaults.
- Formatting is handled by Biome (`indentStyle: "tab"`, double quotes). Run `bunx biome format`/`lint` if you touch formatting-sensitive files.
- Prefer small pure helpers in `src/utils` when logic starts to repeat between functions.
- Logging is optional - most functions accept a `logger` parameter conforming to a simple interface (info, debug, warn, error).

## Testing & docs
- Every exported function must have corresponding unit/integration coverage in `src/**/*.test.ts`.
- When adding new behaviour, update both the docs (README) and this guide if the workflow changes.
- Tests run against real media fixtures to ensure FFmpeg integration works correctly in CI.

## Custom FFmpeg wrapper (`src/vendor/ffmpeg.ts`)
The library uses a lightweight custom wrapper tailored to our specific needs:

### Core functions
- **`detectFFmpeg()`** - Detects and validates FFmpeg/FFprobe installation, returns version info
- **`probe(filePath)`** - Runs `ffprobe` and parses JSON metadata for a media file
- **`runFFmpeg(options, handlers?)`** - Executes FFmpeg with the given options and optional event handlers

### Key patterns
- **Arguments as arrays** - Pass `inputOptions` and `outputOptions` as string arrays (e.g., `["-ss", "10", "-t", "5"]`)
- **Multiple inputs** - `input` can be a string, ReadStream, or array of either for multi-input operations
- **Progress tracking** - Provide `onProgress` handler to receive parsed progress events from stderr
- **Error capture** - Use `onStderr` handler to capture raw stderr output (useful for silence detection)
- **Stream support** - Input/output can be Node.js streams for piped operations

### Example usage
```typescript
import { runFFmpeg, probe } from "@/vendor/ffmpeg";

// Simple conversion
await runFFmpeg({
  input: "input.mp4",
  output: "output.mp4",
  outputOptions: ["-c:v", "copy", "-c:a", "aac"],
});

// With progress tracking
await runFFmpeg(
  {
    input: "input.wav",
    output: "output.mp3",
    outputOptions: ["-b:a", "192k"],
  },
  {
    onProgress: (progress) => console.log(`${progress.percent}%`),
    onDone: () => console.log("Complete!"),
  },
);

// Get metadata
const metadata = await probe("video.mp4");
const duration = metadata.format.duration;
```

### Design philosophy
- **No argument parsing** - Arguments are passed directly to FFmpeg as arrays, avoiding quote/escape issues
- **Promise-based** - All functions return promises, no callback-based APIs
- **Minimal abstraction** - Thin wrapper around `spawn()` with just the features we need
- **Type-safe** - Full TypeScript types for options, handlers, and metadata
