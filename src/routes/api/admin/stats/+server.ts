import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '$lib/server/database';
import { readdirSync, statSync } from 'fs';
import { config } from '$lib/server/config';
import path from 'path';

/**
 * Get system statistics
 * GET /api/admin/stats
 */
export const GET: RequestHandler = async (event) => {
	if (!event.locals.isAuthenticated) {
		throw error(401, 'Unauthorized');
	}

	try {
		const db = database.getDb();

		// Count share links
		const linkCount = db.prepare('SELECT COUNT(*) as count FROM share_links').get() as {
			count: number;
		};

		// Count by source type
		const uploadLinks = db
			.prepare("SELECT COUNT(*) as count FROM share_links WHERE sourceType = 'upload'")
			.get() as { count: number };
		const sharedLinks = db
			.prepare("SELECT COUNT(*) as count FROM share_links WHERE sourceType = 'shared'")
			.get() as { count: number };

		// Total downloads
		const totalDownloads = db
			.prepare('SELECT SUM(downloadCount) as total FROM share_links')
			.get() as {
			total: number | null;
		};

		// Storage usage
		let storageSize = 0;
		let fileCount = 0;
		try {
			const files = readdirSync(config.storage.path);
			fileCount = files.filter((f) => !f.endsWith('.json')).length;

			files.forEach((file) => {
				try {
					const filePath = path.join(config.storage.path, file);
					const stats = statSync(filePath);
					if (stats.isFile()) {
						storageSize += stats.size;
					}
				} catch {
					// Skip files we can't access
				}
			});
		} catch {
			// Storage dir doesn't exist or can't be read
		}

		// Recent activity (last 24h)
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
		const recentUploads = db
			.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE event_type = ? AND timestamp > ?')
			.get('upload', oneDayAgo) as { count: number };

		const recentDownloads = db
			.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE event_type = ? AND timestamp > ?')
			.get('download', oneDayAgo) as { count: number };

		return json({
			links: {
				total: linkCount.count,
				uploads: uploadLinks.count,
				shared: sharedLinks.count
			},
			downloads: {
				total: totalDownloads.total || 0
			},
			storage: {
				used: storageSize,
				fileCount: fileCount
			},
			activity24h: {
				uploads: recentUploads.count,
				downloads: recentDownloads.count
			}
		});
	} catch (err) {
		console.error('Failed to get stats:', err);
		throw error(500, 'Failed to retrieve statistics');
	}
};
