import { type CropOptions, CropPreset } from "../types";

const cropPresets: Record<CropPreset, CropOptions> = {
  [CropPreset.VerticallyCenteredText]: {
    top: 20, // Crop 20% from the top
    bottom: 20, // Crop 20% from the bottom
  },
  [CropPreset.HorizontallyCenteredText]: {
    left: 10, // Crop 10% from the left
    right: 10, // Crop 10% from the right
  },
  [CropPreset.BottomText]: {
    top: 75, // Crop 75% from the top
    bottom: 0, // No cropping from the bottom
  },
  [CropPreset.TopText]: {
    top: 0, // No cropping from the top
    bottom: 75, // Crop 75% from the bottom
  },
};

type CropOffset = {
  width: number; // crop width
  height: number; // crop height
  x: number; // x-offset
  y: number; // y-offset
};

const mapOptionsToCropOffset = (
  width: number,
  height: number,
  cropOptions?: CropOptions | CropPreset
): CropOffset => {
  if (!cropOptions) {
    return { width, height, x: 0, y: 0 };
  }

  const {
    top = 0,
    bottom = 0,
    left = 0,
    right = 0,
  } = cropPresets[cropOptions as CropPreset] || cropOptions;

  // Ensure percentages are between 0 and 100
  const safeTop = Math.min(Math.max(top, 0), 100);
  const safeBottom = Math.min(Math.max(bottom, 0), 100);
  const safeLeft = Math.min(Math.max(left, 0), 100);
  const safeRight = Math.min(Math.max(right, 0), 100);

  // Calculate pixel values to crop
  const cropTop = (safeTop / 100) * height;
  const cropBottom = (safeBottom / 100) * height;
  const cropLeft = (safeLeft / 100) * width;
  const cropRight = (safeRight / 100) * width;

  // Calculate output dimensions
  const cropWidth = width - cropLeft - cropRight;
  const cropHeight = height - cropTop - cropBottom;

  // Ensure dimensions are positive
  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error(
      "Invalid crop dimensions. Please adjust your crop options."
    );
  }

  return { width: cropWidth, height: cropHeight, x: cropLeft, y: cropTop };
};

const mapCropOffsetToCropFilter = ({
  width,
  height,
  x,
  y,
}: CropOffset): string => `crop=${width}:${height}:${x}:${y}`;

export const mapCropOptionsToCropFilter = (
  width: number,
  height: number,
  cropOptions?: CropOptions | CropPreset
): string => {
  const offset = mapOptionsToCropOffset(width, height, cropOptions);
  return mapCropOffsetToCropFilter(offset);
};
