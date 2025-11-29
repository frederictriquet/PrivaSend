import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { storage } from '$lib/server/storage';
import { database } from '$lib/server/database';
import { config } from '$lib/server/config';
import { nanoid } from 'nanoid';
import { checkRateLimit } from '$lib/server/ratelimit';
import { sanitizeFilename, isValidMimeType, hasDangerousExtension } from '$lib/server/security';

/**
 * Handle file upload
 * Supports both full file upload and chunked upload
 */
export const POST: RequestHandler = async (event) => {
	const { request } = event;

	// Rate limiting
	const rateLimit = checkRateLimit(event, 'upload');
	if (!rateLimit.allowed) {
		throw error(429, 'Too many upload requests. Please try again later.');
	}
	try {
		const contentType = request.headers.get('content-type') || '';

		// Handle chunked upload
		if (contentType.includes('application/octet-stream')) {
			return await handleChunkedUpload(request);
		}

		// Handle standard multipart upload
		if (contentType.includes('multipart/form-data')) {
			return await handleMultipartUpload(request);
		}

		throw error(400, 'Invalid content type');
	} catch (err) {
		console.error('Upload error:', err);
		throw error(500, err instanceof Error ? err.message : 'Upload failed');
	}
};

/**
 * Handle multipart form data upload (for smaller files)
 */
async function handleMultipartUpload(request: Request) {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		throw error(400, 'No file provided');
	}

	// Sanitize filename
	const sanitizedFilename = sanitizeFilename(file.name);

	// Check for dangerous extensions
	if (hasDangerousExtension(sanitizedFilename)) {
		throw error(400, 'File type not allowed for security reasons');
	}

	// Validate file size
	if (file.size > config.storage.maxFileSize) {
		throw error(
			413,
			`File size exceeds maximum allowed size of ${formatBytes(config.storage.maxFileSize)}`
		);
	}

	// Validate MIME type if restrictions are configured
	if (!isValidMimeType(file.type, config.storage.allowedMimeTypes)) {
		throw error(415, 'File type not allowed');
	}

	// Read file data
	const arrayBuffer = await file.arrayBuffer();

	// Save file with sanitized name
	const metadata = await storage.saveFile(
		arrayBuffer,
		sanitizedFilename,
		file.type || 'application/octet-stream'
	);

	// Create share link automatically
	const token = nanoid(config.links.tokenLength);
	const linkExpiresAt = new Date();
	linkExpiresAt.setDate(linkExpiresAt.getDate() + config.links.defaultExpirationDays);

	const shareLink = database.createShareLink(token, metadata.id, linkExpiresAt);

	return json({
		success: true,
		fileId: metadata.id,
		fileName: metadata.originalName,
		fileSize: metadata.size,
		expiresAt: metadata.expiresAt.toISOString(),
		shareLink: {
			token: shareLink.token,
			url: `/download/${shareLink.token}`,
			expiresAt: shareLink.expiresAt
		}
	});
}

/**
 * Handle chunked upload (for large files)
 */
async function handleChunkedUpload(request: Request) {
	const fileId = request.headers.get('x-file-id');
	const chunkIndex = parseInt(request.headers.get('x-chunk-index') || '0');
	const totalChunks = parseInt(request.headers.get('x-total-chunks') || '1');
	const fileName = request.headers.get('x-file-name') || 'unknown';
	const mimeType = request.headers.get('x-mime-type') || 'application/octet-stream';

	if (!fileId) {
		throw error(400, 'Missing file ID');
	}

	// Sanitize filename
	const sanitizedFilename = sanitizeFilename(fileName);

	// Check for dangerous extensions (only on first chunk)
	if (chunkIndex === 0 && hasDangerousExtension(sanitizedFilename)) {
		throw error(400, 'File type not allowed for security reasons');
	}

	// Validate MIME type (only on first chunk)
	if (chunkIndex === 0 && !isValidMimeType(mimeType, config.storage.allowedMimeTypes)) {
		throw error(415, 'File type not allowed');
	}

	// Get chunk data
	const arrayBuffer = await request.arrayBuffer();

	// Validate chunk size (allow slightly larger for last chunk)
	if (arrayBuffer.byteLength > config.storage.chunkSize * 1.1) {
		throw error(413, 'Chunk size too large');
	}

	// Save chunk
	await storage.saveChunk(fileId, arrayBuffer, chunkIndex);

	// Check if this is the last chunk
	const isLastChunk = chunkIndex === totalChunks - 1;

	if (isLastChunk) {
		// Finalize upload with sanitized filename
		const metadata = await storage.finalizeChunkedUpload(
			fileId,
			totalChunks,
			sanitizedFilename,
			mimeType
		);

		// Validate final file size
		if (metadata.size > config.storage.maxFileSize) {
			await storage.deleteFile(fileId);
			throw error(
				413,
				`File size exceeds maximum allowed size of ${formatBytes(config.storage.maxFileSize)}`
			);
		}

		// Create share link automatically
		const token = nanoid(config.links.tokenLength);
		const linkExpiresAt = new Date();
		linkExpiresAt.setDate(linkExpiresAt.getDate() + config.links.defaultExpirationDays);

		const shareLink = database.createShareLink(token, metadata.id, linkExpiresAt);

		return json({
			success: true,
			complete: true,
			fileId: metadata.id,
			fileName: metadata.originalName,
			fileSize: metadata.size,
			expiresAt: metadata.expiresAt.toISOString(),
			shareLink: {
				token: shareLink.token,
				url: `/download/${shareLink.token}`,
				expiresAt: shareLink.expiresAt
			}
		});
	}

	// Chunk uploaded successfully
	return json({
		success: true,
		complete: false,
		chunkIndex,
		totalChunks
	});
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
