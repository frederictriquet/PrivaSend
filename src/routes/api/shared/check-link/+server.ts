import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/server/database';

/**
 * Check if a shared file already has a valid link
 * GET /api/shared/check-link?path=relative/path
 */
export const GET: RequestHandler = async ({ url }) => {
	const relativePath = url.searchParams.get('path');

	if (!relativePath) {
		throw error(400, 'path parameter is required');
	}

	// Get database instance
	const db = database.getDb();

	// Find existing valid link for this shared path
	const stmt = db.prepare(`
		SELECT token, expiresAt, downloadCount, maxDownloads
		FROM share_links
		WHERE sharedPath = ? AND sourceType = 'shared'
		ORDER BY createdAt DESC
		LIMIT 1
	`);

	const link = stmt.get(relativePath) as
		| {
				token: string;
				expiresAt: string;
				downloadCount: number;
				maxDownloads: number | null;
		  }
		| undefined;

	if (!link) {
		return json({ hasLink: false });
	}

	// Check if link is still valid
	const now = new Date();
	const expiresAt = new Date(link.expiresAt);

	if (expiresAt < now) {
		return json({ hasLink: false });
	}

	if (link.maxDownloads !== null && link.downloadCount >= link.maxDownloads) {
		return json({ hasLink: false });
	}

	return json({
		hasLink: true,
		token: link.token,
		expiresAt: link.expiresAt,
		downloadCount: link.downloadCount,
		maxDownloads: link.maxDownloads
	});
};
