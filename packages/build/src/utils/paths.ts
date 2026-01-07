/**
 * Path utilities for 10up-build
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the project root directory (where package.json is)
 */
export function getProjectRoot(): string {
	return process.cwd();
}

/**
 * Resolve a path from the project root
 */
export function fromProjectRoot(relativePath: string): string {
	return resolve(getProjectRoot(), relativePath);
}

/**
 * Resolve a path from the package root (where this package is installed)
 */
export function fromPackageRoot(relativePath: string): string {
	return resolve(__dirname, '..', '..', relativePath);
}

/**
 * Check if a file exists in the project
 */
export function hasProjectFile(relativePath: string): boolean {
	return existsSync(fromProjectRoot(relativePath));
}

/**
 * Check if a file exists
 */
export function fileExists(absolutePath: string): boolean {
	return existsSync(absolutePath);
}

/**
 * Get a content-based hash of a file
 */
export function getFileContentHash(filePath: string): string {
	try {
		const content = readFileSync(filePath);
		return createHash('sha256').update(content).digest('hex').slice(0, 8);
	} catch {
		return '';
	}
}

/**
 * Get a content-based hash from a string or buffer
 */
export function getContentHash(content: string | Buffer): string {
	return createHash('sha256').update(content).digest('hex').slice(0, 20);
}

/**
 * Normalize a path to use forward slashes (for glob patterns)
 */
export function normalizePath(filePath: string): string {
	return filePath.replace(/\\/g, '/');
}

/**
 * Remove dist folder prefix from a path
 */
export function removeDistFolder(file: string): string {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
}
