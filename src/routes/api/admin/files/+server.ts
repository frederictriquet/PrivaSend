import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/server/database';
import { storage } from '$lib/server/storage';

/**
 * Get all uploaded files with their share links
 * GET /api/admin/files
 */
export const GET: RequestHandler = async (event) => {
	if (!event.locals.isAuthenticated) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get all share links for uploaded files
		const db = database.getDb();
		const links = db
			.prepare(
				`
			SELECT * FROM share_links
			WHERE sourceType = 'upload'
			ORDER BY createdAt DESC
		`
			)
			.all() as Array<{
			token: string;
			fileId: string;
			expiresAt: string;
			createdAt: string;
			downloadCount: number;
			maxDownloads: number | null;
		}>;

		// Get metadata for each file
		const files = await Promise.all(
			links.map(async (link) => {
				try {
					const metadata = await storage.getMetadata(link.fileId);
					if (!metadata) return null;

					return {
						fileId: link.fileId,
						fileName: metadata.originalName,
						fileSize: metadata.size,
						mimeType: metadata.mimeType,
						uploadedAt: metadata.uploadedAt.toISOString(),
						shareLink: {
							token: link.token,
							url: `/download/${link.token}`,
							expiresAt: link.expiresAt,
							downloadCount: link.downloadCount,
							maxDownloads: link.maxDownloads
						}
					};
				} catch {
					return null;
				}
			})
		);

		// Filter out null entries (deleted files)
		const validFiles = files.filter((f) => f !== null);

		return json({ files: validFiles });
	} catch (err) {
		console.error('Failed to get files:', err);
		throw error(500, 'Failed to retrieve files');
	}
};

/**
 * Delete uploaded file and its share link
 * DELETE /api/admin/files?fileId=...
 */
export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.isAuthenticated) {
		throw error(401, 'Unauthorized');
	}

	const fileId = event.url.searchParams.get('fileId');
	if (!fileId) {
		throw error(400, 'fileId required');
	}

	try {
		// Delete file from storage
		await storage.deleteFile(fileId);

		// Delete share links
		const db = database.getDb();
		db.prepare('DELETE FROM share_links WHERE fileId = ?').run(fileId);

		return json({ success: true });
	} catch (err) {
		console.error('Failed to delete file:', err);
		throw error(500, 'Failed to delete file');
	}
};
