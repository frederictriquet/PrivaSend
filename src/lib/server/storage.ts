import fs from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { config } from './config';

export interface FileMetadata {
	id: string;
	originalName: string;
	size: number;
	mimeType: string;
	uploadedAt: Date;
	expiresAt: Date;
	path: string;
}

export class StorageService {
	private storagePath: string;
	private metadataPath: string;

	constructor() {
		this.storagePath = config.storage.path;
		this.metadataPath = path.join(this.storagePath, 'metadata');
	}

	/**
	 * Initialize storage directories
	 */
	async initialize(): Promise<void> {
		try {
			await fs.mkdir(this.storagePath, { recursive: true });
			await fs.mkdir(this.metadataPath, { recursive: true });
		} catch (error) {
			console.error('Failed to initialize storage:', error);
			throw error;
		}
	}

	/**
	 * Save uploaded file
	 */
	async saveFile(
		fileData: Buffer | ArrayBuffer,
		originalName: string,
		mimeType: string
	): Promise<FileMetadata> {
		await this.initialize();

		const fileId = nanoid(21);
		const filePath = path.join(this.storagePath, fileId);

		// Convert ArrayBuffer to Buffer if needed
		const buffer = fileData instanceof ArrayBuffer ? Buffer.from(fileData) : fileData;

		// Write file
		await fs.writeFile(filePath, buffer);

		// Create metadata
		const metadata: FileMetadata = {
			id: fileId,
			originalName,
			size: buffer.length,
			mimeType,
			uploadedAt: new Date(),
			expiresAt: new Date(
				Date.now() + config.retention.defaultExpirationDays * 24 * 60 * 60 * 1000
			),
			path: filePath
		};

		// Save metadata
		await this.saveMetadata(metadata);

		return metadata;
	}

	/**
	 * Save file chunk (for chunked uploads)
	 */
	async saveChunk(
		fileId: string,
		chunkData: Buffer | ArrayBuffer,
		chunkIndex: number
	): Promise<void> {
		await this.initialize();

		const chunkPath = path.join(this.storagePath, 'chunks', fileId);
		await fs.mkdir(chunkPath, { recursive: true });

		const buffer = chunkData instanceof ArrayBuffer ? Buffer.from(chunkData) : chunkData;
		await fs.writeFile(path.join(chunkPath, `${chunkIndex}`), buffer);
	}

	/**
	 * Finalize chunked upload
	 */
	async finalizeChunkedUpload(
		fileId: string,
		totalChunks: number,
		originalName: string,
		mimeType: string
	): Promise<FileMetadata> {
		const chunkPath = path.join(this.storagePath, 'chunks', fileId);
		const finalPath = path.join(this.storagePath, fileId);

		// Merge chunks
		const writeStream = createWriteStream(finalPath);
		let totalSize = 0;

		for (let i = 0; i < totalChunks; i++) {
			const chunkFile = path.join(chunkPath, `${i}`);
			const chunkBuffer = await fs.readFile(chunkFile);
			totalSize += chunkBuffer.length;
			writeStream.write(chunkBuffer);
		}

		writeStream.end();

		// Wait for write to complete
		await new Promise<void>((resolve, reject) => {
			writeStream.on('finish', () => resolve());
			writeStream.on('error', reject);
		});

		// Clean up chunks
		await fs.rm(chunkPath, { recursive: true, force: true });

		// Create metadata
		const metadata: FileMetadata = {
			id: fileId,
			originalName,
			size: totalSize,
			mimeType,
			uploadedAt: new Date(),
			expiresAt: new Date(
				Date.now() + config.retention.defaultExpirationDays * 24 * 60 * 60 * 1000
			),
			path: finalPath
		};

		await this.saveMetadata(metadata);

		return metadata;
	}

	/**
	 * Get file metadata
	 */
	async getMetadata(fileId: string): Promise<FileMetadata | null> {
		try {
			const metadataFile = path.join(this.metadataPath, `${fileId}.json`);
			const data = await fs.readFile(metadataFile, 'utf-8');
			const metadata = JSON.parse(data);

			// Convert date strings back to Date objects
			metadata.uploadedAt = new Date(metadata.uploadedAt);
			metadata.expiresAt = new Date(metadata.expiresAt);

			return metadata;
		} catch {
			return null;
		}
	}

	/**
	 * Save file metadata
	 */
	private async saveMetadata(metadata: FileMetadata): Promise<void> {
		const metadataFile = path.join(this.metadataPath, `${metadata.id}.json`);
		await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
	}

	/**
	 * Delete file and metadata
	 */
	async deleteFile(fileId: string): Promise<void> {
		const metadata = await this.getMetadata(fileId);
		if (!metadata) return;

		// Delete file
		try {
			await fs.unlink(metadata.path);
		} catch (error) {
			console.error(`Failed to delete file ${fileId}:`, error);
		}

		// Delete metadata
		const metadataFile = path.join(this.metadataPath, `${fileId}.json`);
		try {
			await fs.unlink(metadataFile);
		} catch (error) {
			console.error(`Failed to delete metadata ${fileId}:`, error);
		}
	}

	/**
	 * Clean up expired files
	 */
	async cleanupExpiredFiles(): Promise<number> {
		const metadataFiles = await fs.readdir(this.metadataPath);
		let deletedCount = 0;

		for (const file of metadataFiles) {
			if (!file.endsWith('.json')) continue;

			const fileId = file.replace('.json', '');
			const metadata = await this.getMetadata(fileId);

			if (metadata && metadata.expiresAt < new Date()) {
				await this.deleteFile(fileId);
				deletedCount++;
			}
		}

		return deletedCount;
	}

	/**
	 * Get all files metadata
	 */
	async getAllMetadata(): Promise<FileMetadata[]> {
		const metadataFiles = await fs.readdir(this.metadataPath);
		const allMetadata: FileMetadata[] = [];

		for (const file of metadataFiles) {
			if (!file.endsWith('.json')) continue;

			const fileId = file.replace('.json', '');
			const metadata = await this.getMetadata(fileId);

			if (metadata) {
				allMetadata.push(metadata);
			}
		}

		return allMetadata;
	}

	/**
	 * Check if file exists
	 */
	fileExists(fileId: string): boolean {
		const filePath = path.join(this.storagePath, fileId);
		return existsSync(filePath);
	}
}

// Singleton instance
export const storage = new StorageService();
