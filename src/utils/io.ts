import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Creates a new temporary directory using the provided prefix.
 *
 * @param {string} [prefix="ffmpeg-simplified"] - Prefix used when generating the directory name.
 * @returns {Promise<string>} Absolute path to the created temporary directory.
 */
export const createTempDir = async (
  prefix = "ffmpeg-simplified"
): Promise<string> => {
  const tempDirBase = path.join(os.tmpdir(), prefix);
  return fs.mkdtemp(tempDirBase);
};

/**
 * Builds a SHA-256 hash based on the provided list of file paths.
 *
 * @param {string[]} inputFiles - File paths that should influence the generated hash.
 * @returns {string} A deterministic hexadecimal hash.
 */
export const generateHashFromInputFiles = (inputFiles: string[]): string => {
  const hash = crypto.createHash("sha256");
  hash.update(inputFiles.join("|"));
  return hash.digest("hex");
};

/**
 * Generates a SHA-256 hash from a plain string.
 *
 * @param {string} str - Input string to hash.
 * @returns {string} Hexadecimal hash representation.
 */
export const stringToHash = (str: string): string =>
  generateHashFromInputFiles([str]);

/**
 * Determines whether the provided path exists on disk.
 *
 * @param {string} filePath - Path to check for existence.
 * @returns {Promise<boolean>} Resolves with true when the path exists, false otherwise.
 */
export const fileExists = async (filePath: string): Promise<boolean> =>
  !!(await fs.stat(filePath).catch(() => false));
