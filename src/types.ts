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
};

/**
 * Options for slicing and merging media files.
 */
export type SliceAndMergeOptions = {
  /**
   * Array of time ranges to slice.
   */
  ranges: TimeRange[];
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
