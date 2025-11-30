import fs from 'fs';
import path from 'path';
import { config } from './config';

export interface FileEntry {
	name: string;
	relativePath: string;
	size: number;
	isDirectory: boolean;
	mimeType: string;
	lastModified: Date;
}

/**
 * Service for managing shared volume files
 * SECURITY: Prevents path traversal and unauthorized access
 */
export class SharedVolumeService {
	private readonly basePath: string;

	constructor() {
		if (!config.sharedVolume.enabled) {
			throw new Error('Shared volume is not enabled');
		}

		this.basePath = path.resolve(config.sharedVolume.path);

		if (!fs.existsSync(this.basePath)) {
			throw new Error(`Shared volume path does not exist: ${this.basePath}`);
		}
	}

	/**
	 * SECURITY: Validates path to prevent traversal attacks
	 */
	validatePath(relativePath: string): string {
		if (!relativePath || relativePath.trim() === '') {
			return this.basePath;
		}

		// Reject paths with ..
		if (relativePath.includes('..')) {
			throw new Error('Invalid path: path traversal detected');
		}

		// Normalize and resolve
		const fullPath = path.resolve(this.basePath, path.normalize(relativePath));

		// Ensure path is within basePath
		if (!fullPath.startsWith(this.basePath)) {
			throw new Error('Invalid path: outside shared volume');
		}

		// Check existence
		if (!fs.existsSync(fullPath)) {
			throw new Error('Path does not exist');
		}

		return fullPath;
	}

	/**
	 * List files in directory
	 */
	listFiles(relativePath: string = ''): FileEntry[] {
		const fullPath = this.validatePath(relativePath);
		const stats = fs.statSync(fullPath);

		if (!stats.isDirectory()) {
			throw new Error('Path is not a directory');
		}

		// Check depth
		const depth = path.relative(this.basePath, fullPath).split(path.sep).filter(Boolean).length;
		if (depth > config.sharedVolume.maxDepth) {
			throw new Error(`Maximum depth (${config.sharedVolume.maxDepth}) exceeded`);
		}

		const entries = fs.readdirSync(fullPath, { withFileTypes: true });

		return entries
			.filter((entry) => !entry.name.startsWith('.'))
			.map((entry) => {
				const entryPath = path.join(fullPath, entry.name);
				const stats = fs.statSync(entryPath);
				const relPath = path.relative(this.basePath, entryPath);

				return {
					name: entry.name,
					relativePath: relPath,
					size: entry.isDirectory() ? 0 : stats.size,
					isDirectory: entry.isDirectory(),
					mimeType: entry.isDirectory() ? 'inode/directory' : this.getMimeType(entry.name),
					lastModified: stats.mtime
				};
			})
			.sort((a, b) => {
				if (a.isDirectory && !b.isDirectory) return -1;
				if (!a.isDirectory && b.isDirectory) return 1;
				return a.name.localeCompare(b.name);
			});
	}

	/**
	 * Get file info
	 */
	getFileInfo(relativePath: string): FileEntry {
		const fullPath = this.validatePath(relativePath);
		const stats = fs.statSync(fullPath);
		const relPath = path.relative(this.basePath, fullPath);

		return {
			name: path.basename(fullPath),
			relativePath: relPath || '.',
			size: stats.isDirectory() ? 0 : stats.size,
			isDirectory: stats.isDirectory(),
			mimeType: stats.isDirectory() ? 'inode/directory' : this.getMimeType(path.basename(fullPath)),
			lastModified: stats.mtime
		};
	}

	/**
	 * Detect MIME type from extension
	 */
	private getMimeType(fileName: string): string {
		const ext = path.extname(fileName).toLowerCase();
		const types: Record<string, string> = {
			'.txt': 'text/plain',
			'.pdf': 'application/pdf',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.zip': 'application/zip',
			'.json': 'application/json'
		};
		return types[ext] || 'application/octet-stream';
	}

	getBasePath(): string {
		return this.basePath;
	}

	isReadOnly(): boolean {
		return config.sharedVolume.readOnly;
	}

	getMaxDepth(): number {
		return config.sharedVolume.maxDepth;
	}

	static isEnabled(): boolean {
		return config.sharedVolume.enabled;
	}
}

export function createSharedVolumeService(): SharedVolumeService | null {
	if (!SharedVolumeService.isEnabled()) {
		return null;
	}
	try {
		return new SharedVolumeService();
	} catch {
		return null;
	}
}
