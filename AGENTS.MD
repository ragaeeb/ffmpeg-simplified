# Agent guidelines

## Tooling & workflows
- Use **Bun** commands for dependency management (`bun install`, `bun update`, `bun add`, etc.).
- Build artifacts with `bun run build` (tsdown) and run the suite with `bun test`.
- Always keep the tooling on the latest released versions: run `bun update --latest` after touching `package.json`.
- Tests rely on `testing/sample.*` fixtures that are wired up through `setupTests.ts` via `bun test --preload`.
- Changes that affect behaviour must be reflected in `README.md`.

## Repository map
- `src/functions/` houses the public API. Each function should stay small, composable, and fully JSDoc'd.
- `src/vendor/ffmpeggy.ts` is the configuration wrapper around the `ffmpeggy` npm package which uses locally installed `ffmpeg`/`ffprobe` binaries.
- `src/utils/` contains reusable helpers (IO, logging, cropping, preprocessing filters).
- `testing/` stores real media fixtures; avoid renaming without adjusting `setupTests.ts`.

## Coding conventions
- Keep the code TypeScript-strict, prefer async/await and ES module syntax.
- Maintain comprehensive JSDoc comments for every exported function and surface important parameter defaults.
- Formatting is handled by Biome (`indentStyle: "tab"`, double quotes). Run `bunx biome format`/`lint` if you touch formatting-sensitive files.
- Prefer small pure helpers in `src/utils` when logic starts to repeat between functions.
- Logging goes through `src/utils/logger.ts` (Pino). Avoid `console.*` calls.

## Testing & docs
- Every exported function must have corresponding unit/integration coverage in `src/**/*.test.ts`.
- When adding new behaviour, update both the docs (README) and this guide if the workflow changes.
- If behaviour depends on environment configuration (e.g., custom `FFMPEG_PATH`), document it explicitly.

## FFmpeggy integration
- The library uses [`ffmpeggy`](https://github.com/mekwall/ffmpeggy) v3.1.3+ as the FFmpeg wrapper
- Binary detection is handled automatically via `which` in `src/vendor/ffmpeggy.ts`
- FFmpeggy uses Promise-based APIs—prefer `await ffmpeggy.done()` over callbacks
- Key patterns:
  - Create instances: `new FFmpeggy({ input, output, outputOptions })`
  - Auto-run: Set `autorun: true` to start immediately
  - Events: `on('progress')`, `on('done')`, `on('error')`
  - Probe: `await FFmpeggy.probe(filePath)` for metadata
