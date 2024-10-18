export interface NoiseReductionOptions {
  afftdn_nf?: null | number;
  afftdnStart?: null | number;
  afftdnStop?: null | number;
  dialogueEnhance?: boolean;
  highpass?: null | number;
  lowpass?: null | number;
}

export interface PreprocessOptions {
  noiseReduction?: NoiseReductionOptions | null;
}

export interface SilenceDetectionOptions {
  // -50 for '-50dB'
  silenceDuration: number;
  silenceThreshold: number; // in seconds (ie: 0.5 for 0.5s)
}

export interface SplitOptions {
  chunkDuration?: number; // defaults to 60
  chunkMinThreshold?: number;
  silenceDetection?: SilenceDetectionOptions;
}

export interface PreprocessingCallbacks {
  onPreprocessingFinished?: (filePath: string) => Promise<void>;
  onPreprocessingProgress?: (percent: number) => void;
  onPreprocessingStarted?: (filePath: string) => Promise<void>;
}

export interface SplitOnSilenceCallbacks {
  onSplittingFinished?: () => Promise<void>;
  onSplittingProgress?: (chunkFilePath: string, chunkIndex: number) => void;
  onSplittingStarted?: (totalChunks: number) => Promise<void>;
}

export type TimeRange = {
  end: number;
  start: number;
};

export type AudioChunk = {
  filename: string;
  range: TimeRange;
};
