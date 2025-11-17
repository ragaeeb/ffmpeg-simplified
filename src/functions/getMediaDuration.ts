import { probe } from "@/vendor/ffmpeg";

/**
 * Retrieves the duration of a media file in seconds.
 *
 * @param {string} filePath - Path to the media file.
 * @returns {Promise<number>} - Promise resolving to the duration of the media file in seconds.
 */
export const getMediaDuration = async (filePath: string): Promise<number> => {
	const metadata = await probe(filePath);
	const rawDuration = metadata.format.duration ?? 0;
	const parsed =
		typeof rawDuration === "number"
			? rawDuration
			: Number.parseFloat(String(rawDuration));

	return Number.isFinite(parsed) ? parsed : 0;
};
