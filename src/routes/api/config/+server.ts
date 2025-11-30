import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/server/config';

/**
 * Get server configuration
 * GET /api/config
 */
export const GET: RequestHandler = async () => {
	return json({
		upload: {
			enabled: config.upload.enabled
		},
		sharedVolume: {
			enabled: config.sharedVolume.enabled
		}
	});
};
