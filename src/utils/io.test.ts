import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
    createTempDir,
    generateHashFromInputFiles,
    stringToHash,
    fileExists,
} from './io';

describe('io', () => {
    describe('createTempDir', () => {
        let tempDirs: string[] = [];

        afterEach(async () => {
            for (const dir of tempDirs) {
                try {
                    await fs.rm(dir, { recursive: true });
                } catch {
                    // Ignore errors
                }
            }
            tempDirs = [];
        });

        it('should create a temporary directory with default prefix', async () => {
            const tempDir = await createTempDir();
            tempDirs.push(tempDir);

            expect(tempDir).toContain('ffmpeg-simplified');
            expect(tempDir).toContain(os.tmpdir());

            const stats = await fs.stat(tempDir);
            expect(stats.isDirectory()).toBe(true);
        });

        it('should create a temporary directory with custom prefix', async () => {
            const customPrefix = 'test-prefix';
            const tempDir = await createTempDir(customPrefix);
            tempDirs.push(tempDir);

            expect(tempDir).toContain(customPrefix);
            expect(tempDir).toContain(os.tmpdir());

            const stats = await fs.stat(tempDir);
            expect(stats.isDirectory()).toBe(true);
        });

        it('should create unique directories on each call', async () => {
            const dir1 = await createTempDir();
            const dir2 = await createTempDir();
            tempDirs.push(dir1, dir2);

            expect(dir1).not.toEqual(dir2);
        });
    });

    describe('generateHashFromInputFiles', () => {
        it('should generate a deterministic hash from file paths', () => {
            const files = ['/path/to/file1.mp4', '/path/to/file2.mp3'];
            const hash1 = generateHashFromInputFiles(files);
            const hash2 = generateHashFromInputFiles(files);

            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
        });

        it('should produce different hashes for different file paths', () => {
            const files1 = ['/path/to/file1.mp4'];
            const files2 = ['/path/to/file2.mp4'];

            const hash1 = generateHashFromInputFiles(files1);
            const hash2 = generateHashFromInputFiles(files2);

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty array', () => {
            const hash = generateHashFromInputFiles([]);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should handle single file path', () => {
            const hash = generateHashFromInputFiles(['/path/to/file.mp4']);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should be order-sensitive', () => {
            const files1 = ['/path/to/file1.mp4', '/path/to/file2.mp3'];
            const files2 = ['/path/to/file2.mp3', '/path/to/file1.mp4'];

            const hash1 = generateHashFromInputFiles(files1);
            const hash2 = generateHashFromInputFiles(files2);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('stringToHash', () => {
        it('should generate a hash from a string', () => {
            const hash = stringToHash('test-string');
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should produce deterministic hashes', () => {
            const hash1 = stringToHash('test-string');
            const hash2 = stringToHash('test-string');

            expect(hash1).toBe(hash2);
        });

        it('should produce different hashes for different strings', () => {
            const hash1 = stringToHash('string1');
            const hash2 = stringToHash('string2');

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty string', () => {
            const hash = stringToHash('');
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    describe('fileExists', () => {
        let tempDir: string;
        let testFile: string;

        beforeEach(async () => {
            tempDir = await createTempDir();
            testFile = path.join(tempDir, 'test.txt');
        });

        afterEach(async () => {
            await fs.rm(tempDir, { recursive: true });
        });

        it('should return true for existing file', async () => {
            await fs.writeFile(testFile, 'test content');
            const exists = await fileExists(testFile);
            expect(exists).toBe(true);
        });

        it('should return false for non-existent file', async () => {
            const nonExistentFile = path.join(tempDir, 'nonexistent.txt');
            const exists = await fileExists(nonExistentFile);
            expect(exists).toBe(false);
        });

        it('should return true for existing directory', async () => {
            const exists = await fileExists(tempDir);
            expect(exists).toBe(true);
        });

        it('should return false for non-existent directory', async () => {
            const nonExistentDir = path.join(os.tmpdir(), 'nonexistent-dir-12345');
            const exists = await fileExists(nonExistentDir);
            expect(exists).toBe(false);
        });
    });
});

