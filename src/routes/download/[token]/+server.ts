import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/server/database';
import { storage } from '$lib/server/storage';
import { createReadStream, statSync } from 'fs';
import { Readable } from 'stream';
import { checkRateLimit } from '$lib/server/ratelimit';

/**
 * Handle file download with Range support
 * GET /download/[token]
 */
export const GET: RequestHandler = async (event) => {
	const { params, request } = event;
	const { token } = params;

	// Rate limiting
	const rateLimit = checkRateLimit(event, 'download');
	if (!rateLimit.allowed) {
		throw error(429, 'Too many download requests. Please try again later.');
	}

	// Get share link
	const shareLink = database.getShareLink(token);

	if (!shareLink) {
		throw error(404, 'Link not found');
	}

	// Check if link is valid
	if (!database.isLinkValid(shareLink)) {
		throw error(410, 'Link has expired or reached download limit');
	}

	// Get file metadata
	const metadata = await storage.getMetadata(shareLink.fileId);

	if (!metadata) {
		throw error(404, 'File not found');
	}

	// Verify file still exists
	if (!storage.fileExists(shareLink.fileId)) {
		throw error(404, 'File not found on disk');
	}

	// Increment download count
	database.incrementDownloadCount(token);

	// Get file stats
	const stat = statSync(metadata.path);
	const fileSize = stat.size;

	// Check for Range header (for resume/partial downloads)
	const rangeHeader = request.headers.get('range');

	if (rangeHeader) {
		// Parse range header
		const parts = rangeHeader.replace(/bytes=/, '').split('-');
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

		// Validate range
		if (start >= fileSize || end >= fileSize) {
			throw error(416, 'Range not satisfiable');
		}

		const chunkSize = end - start + 1;
		const stream = createReadStream(metadata.path, { start, end });

		return new Response(Readable.toWeb(stream) as ReadableStream, {
			status: 206,
			headers: {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize.toString(),
				'Content-Type': metadata.mimeType,
				'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.originalName)}"`,
				'Cache-Control': 'no-cache'
			}
		});
	}

	// Full file download
	const stream = createReadStream(metadata.path);

	return new Response(Readable.toWeb(stream) as ReadableStream, {
		status: 200,
		headers: {
			'Content-Type': metadata.mimeType,
			'Content-Length': fileSize.toString(),
			'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.originalName)}"`,
			'Accept-Ranges': 'bytes',
			'Cache-Control': 'no-cache'
		}
	});
};
