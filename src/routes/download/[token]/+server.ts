import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/server/database';
import { storage } from '$lib/server/storage';
import { SharedVolumeService } from '$lib/server/sharedvolume';
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

	// Determine file path based on source type
	let filePath: string;
	let fileName: string;
	let mimeType: string;
	let fileSize: number;

	if (shareLink.sourceType === 'shared') {
		// File from shared volume
		if (!shareLink.sharedPath) {
			throw error(500, 'Invalid share link: missing shared path');
		}

		const sharedService = new SharedVolumeService();
		const fullPath = sharedService.validatePath(shareLink.sharedPath);

		const stat = statSync(fullPath);
		filePath = fullPath;
		fileName = shareLink.fileId; // fileId contains the filename for shared files
		mimeType = sharedService.getFileInfo(shareLink.sharedPath).mimeType;
		fileSize = stat.size;
	} else {
		// File from uploads (existing logic)
		const metadata = await storage.getMetadata(shareLink.fileId);

		if (!metadata) {
			throw error(404, 'File not found');
		}

		if (!storage.fileExists(shareLink.fileId)) {
			throw error(404, 'File not found on disk');
		}

		filePath = metadata.path;
		fileName = metadata.originalName;
		mimeType = metadata.mimeType;
		fileSize = metadata.size;
	}

	// Increment download count
	database.incrementDownloadCount(token);

	// Get file stats (already have fileSize)
	const stat = statSync(filePath);

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
		const stream = createReadStream(filePath, { start, end });

		return new Response(Readable.toWeb(stream) as ReadableStream, {
			status: 206,
			headers: {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize.toString(),
				'Content-Type': mimeType,
				'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
				'Cache-Control': 'no-cache'
			}
		});
	}

	// Full file download
	const stream = createReadStream(filePath);

	return new Response(Readable.toWeb(stream) as ReadableStream, {
		status: 200,
		headers: {
			'Content-Type': mimeType,
			'Content-Length': fileSize.toString(),
			'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
			'Accept-Ranges': 'bytes',
			'Cache-Control': 'no-cache'
		}
	});
};
