/**
 * Logger interface compatible with console and most logging libraries.
 * All methods are optional to allow partial implementations.
 */
export interface Logger {
  /** Log an informational message */
  info?: (message: string, ...args: any[]) => void;
  /** Log a debug message */
  debug?: (message: string, ...args: any[]) => void;
  /** Log a warning message */
  warn?: (message: string, ...args: any[]) => void;
  /** Log an error message */
  error?: (message: string, ...args: any[]) => void;
}

/**
 * Represents a time range with start and end times in seconds.
 */
export type TimeRange = {
  /**
   * End time in seconds.
   */
  end: number;

  /**
   * Start time in seconds.
   */
  start: number;
};

/**
 * Options for noise reduction during media formatting.
 */
export interface NoiseReductionOptions {
  /**
   * Noise floor for the `afftdn` filter.
   */
  afftdn_nf?: null | number;

  /**
   * Start time to apply the `afftdn` filter.
   */
  afftdnStart?: null | number;

  /**
   * End time to stop applying the `afftdn` filter.
   */
  afftdnStop?: null | number;

  /**
   * Enable dialogue enhancement.
   */
  dialogueEnhance?: boolean;

  /**
   * Frequency for the high-pass filter.
   */
  highpass?: null | number;

  /**
   * Frequency for the low-pass filter.
   */
  lowpass?: null | number;
}

/**
 * Options for preprocessing media files.
 */
export interface PreprocessOptions {
  /**
   * Noise reduction settings.
   */
  noiseReduction?: NoiseReductionOptions | null;

  /** Use the maximum number of threads */
  fast?: boolean;
}

/**
 * Options for silence detection in audio files.
 */
export interface SilenceDetectionOptions {
  /**
   * Minimum duration of silence to detect (in seconds).
   */
  silenceDuration: number; // in seconds (ie: 0.5 for 0.5s)

  /**
   * Silence threshold level (in dB).
   */
  silenceThreshold: number; // -50 for '-50dB'
}

/**
 * Options for splitting audio files on silences.
 */
export interface SplitOptions {
  /**
   * Desired duration of each chunk (in seconds).
   */
  chunkDuration?: number; // defaults to 60

  /**
   * Minimum duration threshold for chunks to include (in seconds).
   */
  chunkMinThreshold?: number;

  /**
   * Silence detection settings.
   */
  silenceDetection?: SilenceDetectionOptions;
}

/**
 * Options for slicing media files.
 */
export type SliceOptions = {
  /**
   * Array of time ranges to slice.
   */
  ranges: TimeRange[]; // Start/end times in seconds

  /**
   * Output directory for the sliced files.
   */
  outputFolder: string;

  /** Use the maximum number of threads */
  fast?: boolean;
};

/**
 * Options for slicing and merging media files.
 */
export type SliceAndMergeOptions = {
  /**
   * Array of time ranges to slice. Can either be in the form of {start: 0, end: 10} or '0-0:10'
   */
  ranges: TimeRange[] | string[];

  /** Use the maximum number of threads */
  fast?: boolean;
};

/**
 * Options for merging media files.
 */
export type MergeOptions = {
  /** Use the maximum number of threads */
  fast?: boolean;
};

/**
 * Callback functions for media preprocessing.
 */
export interface PreprocessingCallbacks {
  /**
   * Called when preprocessing finishes.
   * @param {string} filePath - Path to the processed file.
   */
  onPreprocessingFinished?: (filePath: string) => Promise<void>;

  /**
   * Called to report preprocessing progress.
   * @param {number} percent - Progress percentage.
   */
  onPreprocessingProgress?: (percent: number) => void;

  /**
   * Called when preprocessing starts.
   * @param {string} filePath - Path to the output file.
   */
  onPreprocessingStarted?: (filePath: string) => Promise<void>;
}

/**
 * Callback functions for splitting audio on silences.
 */
export interface SplitOnSilenceCallbacks {
  /**
   * Called when splitting finishes.
   */
  onSplittingFinished?: () => Promise<void>;

  /**
   * Called to report splitting progress.
   * @param {string} chunkFilePath - Path to the current chunk file.
   * @param {number} chunkIndex - Index of the current chunk.
   */
  onSplittingProgress?: (chunkFilePath: string, chunkIndex: number) => void;

  /**
   * Called when splitting starts.
   * @param {number} totalChunks - Total number of chunks to be created.
   */
  onSplittingStarted?: (totalChunks: number) => Promise<void>;
}

/**
 * Represents an audio chunk with a file name and time range.
 */
export type AudioChunk = {
  /**
   * File name of the audio chunk.
   */
  filename: string;

  /**
   * Time range of the audio chunk.
   */
  range: TimeRange;
};

/**
 * Options for cropping video frames.
 */
export interface CropOptions {
  /** Percentage to crop from the top (0-100) */
  top?: number;
  /** Percentage to crop from the bottom (0-100) */
  bottom?: number;
  /** Percentage to crop from the left (0-100) */
  left?: number;
  /** Percentage to crop from the right (0-100) */
  right?: number;
}

/**
 * Preset options for cropping video frames to focus on text regions.
 */
export enum CropPreset {
  HorizontallyCenteredText = "HorizontallyCenteredText",
  VerticallyCenteredText = "VerticallyCenteredText",
  BottomText = "BottomText",
  TopText = "TopText",
}

/**
 * Preset options for preprocessing video frames.
 */
export enum FramePreprocessingPreset {
  DarkTextOnLightBackground = "DarkTextOnLightBackground",
  LightTextOnDarkBackground = "LightTextOnDarkBackground",
}

/**
 * Options for preprocessing video frames before extraction.
 */
export interface FramePreprocessingOptions {
  /** Preprocessing preset to apply */
  preset?: FramePreprocessingPreset;
  /** Contrast adjustment value */
  contrast?: number;
  /** Brightness adjustment value */
  brightness?: number;
  /** Threshold value for processing */
  threshold?: number;
  /** Whether to convert to grayscale */
  grayscale?: boolean;
}

/**
 * Options for extracting frames from a video file.
 */
export type GetFramesOptions = {
  /** Frame extraction frequency in seconds */
  frequency: number;
  /** Crop options for frames */
  cropOptions?: CropPreset | CropOptions;
  /** Preprocessing options for frames */
  preprocessingOptions?: FramePreprocessingOptions | FramePreprocessingPreset;
  /** Output directory for the extracted frame files */
  outputFolder: string;
  /** Prefix for frame filenames */
  filePrefix?: string;
  /** File extension for extracted frames */
  fileExtension?: string;
};

/**
 * Represents a single extracted frame with its filename and timestamp.
 */
export type Frame = {
  /** Path to the frame file */
  filename: string;
  /** Start time of the frame in seconds */
  start: number;
};
