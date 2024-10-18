import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

export const createTempDir = async (
  prefix = "ffmpeg-simplified"
): Promise<string> => {
  const tempDirBase = path.join(os.tmpdir(), prefix);
  return fs.mkdtemp(tempDirBase);
};

export const generateHashFromInputFiles = (inputFiles: string[]): string => {
  const hash = crypto.createHash("sha256");
  hash.update(inputFiles.join("|")); // Join file paths and hash them
  return hash.digest("hex"); // Return hex representation of the hash
};

export const stringToHash = (str: string): string =>
  generateHashFromInputFiles([str]);

export const fileExists = async (path: string): Promise<boolean> =>
  !!(await fs.stat(path).catch(() => false));
