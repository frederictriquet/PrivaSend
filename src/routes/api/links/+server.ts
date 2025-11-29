import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/server/database';
import { storage } from '$lib/server/storage';
import { config } from '$lib/server/config';
import { nanoid } from 'nanoid';

/**
 * Create a new share link for an uploaded file
 * POST /api/links
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { fileId, expirationDays, maxDownloads } = body;

		if (!fileId) {
			throw error(400, 'File ID is required');
		}

		// Verify file exists
		const metadata = await storage.getMetadata(fileId);
		if (!metadata) {
			throw error(404, 'File not found');
		}

		// Generate secure token
		const token = nanoid(config.links.tokenLength);

		// Calculate expiration date
		const expiresInDays = expirationDays || config.links.defaultExpirationDays;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);

		// Create share link in database
		const shareLink = database.createShareLink(
			token,
			fileId,
			expiresAt,
			maxDownloads || null
		);

		return json({
			success: true,
			link: {
				token: shareLink.token,
				url: `/download/${shareLink.token}`,
				expiresAt: shareLink.expiresAt,
				maxDownloads: shareLink.maxDownloads,
				fileName: metadata.originalName,
				fileSize: metadata.size
			}
		});
	} catch (err) {
		console.error('Link creation error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, err instanceof Error ? err.message : 'Failed to create link');
	}
};

/**
 * Get link information
 * GET /api/links?token=xxx
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const token = url.searchParams.get('token');

		if (!token) {
			throw error(400, 'Token is required');
		}

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

		return json({
			success: true,
			link: {
				token: shareLink.token,
				expiresAt: shareLink.expiresAt,
				downloadCount: shareLink.downloadCount,
				maxDownloads: shareLink.maxDownloads,
				fileName: metadata.originalName,
				fileSize: metadata.size,
				mimeType: metadata.mimeType
			}
		});
	} catch (err) {
		console.error('Link retrieval error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, err instanceof Error ? err.message : 'Failed to retrieve link');
	}
};
