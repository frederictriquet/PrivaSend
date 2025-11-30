import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SharedVolumeService } from '$lib/server/sharedvolume';

/**
 * Browse files in shared volume
 * GET /api/shared/browse?path=relative/path
 */
export const GET: RequestHandler = async ({ url }) => {
	// Check if shared volume is enabled
	if (!SharedVolumeService.isEnabled()) {
		throw error(404, 'Shared volume feature is not enabled');
	}

	try {
		const service = new SharedVolumeService();
		const relativePath = url.searchParams.get('path') || '';

		const files = service.listFiles(relativePath);

		return json({
			success: true,
			files,
			currentPath: relativePath || '.',
			basePath: service.getBasePath(),
			readOnly: service.isReadOnly()
		});
	} catch (err) {
		console.error('Browse error:', err);
		throw error(400, err instanceof Error ? err.message : 'Failed to browse directory');
	}
};
