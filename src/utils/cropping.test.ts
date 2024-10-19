import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { mapCropOptionsToCropFilter } from "./cropping";
import { type CropOptions, CropPreset } from "../types";

describe("cropping", () => {
  describe("mapCropOptionsToCropFilter", () => {
    let videoWidth: number;
    let videoHeight: number;

    beforeEach(() => {
      videoWidth = 1920;
      videoHeight = 1080;
    });

    it("should return correct crop filter string for a preset", () => {
      const filterString = mapCropOptionsToCropFilter(
        videoWidth,
        videoHeight,
        CropPreset.VerticallyCenteredText
      );
      expect(filterString).toBe("crop=1920:648:0:216");
    });

    it("should return correct crop filter string for custom options", () => {
      const customOptions: CropOptions = {
        top: 10,
        bottom: 15,
        left: 5,
        right: 5,
      };
      const filterString = mapCropOptionsToCropFilter(
        videoWidth,
        videoHeight,
        customOptions
      );
      expect(filterString).toBe("crop=1728:810:96:108");
    });

    it("should return full crop filter string when no cropOptions are provided", () => {
      const filterString = mapCropOptionsToCropFilter(videoWidth, videoHeight);
      expect(filterString).toBe("crop=1920:1080:0:0");
    });

    it("should handle invalid preset", () => {
      expect(
        mapCropOptionsToCropFilter(
          videoWidth,
          videoHeight,
          "InvalidPreset" as CropPreset
        )
      ).toBe("crop=1920:1080:0:0");
    });
  });
});
