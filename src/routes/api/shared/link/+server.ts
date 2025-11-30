import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SharedVolumeService } from '$lib/server/sharedvolume';
import { database } from '$lib/server/database';
import { nanoid } from 'nanoid';
import { config } from '$lib/server/config';

/**
 * Create share link for a file in shared volume
 * POST /api/shared/link
 * Body: { relativePath: string, expirationDays?: number, maxDownloads?: number }
 */
export const POST: RequestHandler = async ({ request }) => {
	if (!SharedVolumeService.isEnabled()) {
		throw error(404, 'Shared volume feature is not enabled');
	}

	try {
		const body = await request.json();
		const { relativePath, expirationDays, maxDownloads } = body;

		if (!relativePath) {
			throw error(400, 'relativePath is required');
		}

		const service = new SharedVolumeService();

		// Get file info and validate
		const fileInfo = service.getFileInfo(relativePath);

		if (fileInfo.isDirectory) {
			throw error(400, 'Cannot share directories, only files');
		}

		// Generate token
		const token = nanoid(config.links.tokenLength);

		// Calculate expiration
		const expiresInDays = expirationDays || config.links.defaultExpirationDays;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);

		// Create share link in database
		// Note: We need to update database.createShareLink to accept sourceType and sharedPath
		// For now, using a manual insert
		const db = database.getDb();
		const stmt = db.prepare(`
			INSERT INTO share_links (
				token, fileId, expiresAt, createdAt, maxDownloads,
				sourceType, sharedPath, passwordHash, pin, allowedIps
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const createdAt = new Date().toISOString();
		const result = stmt.run(
			token,
			fileInfo.name, // Use filename as fileId for shared files
			expiresAt.toISOString(),
			createdAt,
			maxDownloads || null,
			'shared',
			relativePath,
			null,
			null,
			null
		);

		return json({
			success: true,
			link: {
				token,
				url: `/download/${token}`,
				fileName: fileInfo.name,
				fileSize: fileInfo.size,
				mimeType: fileInfo.mimeType,
				expiresAt: expiresAt.toISOString(),
				maxDownloads: maxDownloads || null,
				sourceType: 'shared'
			}
		});
	} catch (err) {
		console.error('Share error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, err instanceof Error ? err.message : 'Failed to create share link');
	}
};
