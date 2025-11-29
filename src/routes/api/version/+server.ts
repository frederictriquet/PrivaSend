import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Hardcode version to avoid build-time filesystem access
const VERSION = '0.4.0';
const NAME = 'privasend';

/**
 * Get application version and info
 * GET /api/version
 */
export const GET: RequestHandler = async () => {
	return json({
		name: NAME,
		version: VERSION,
		nodeVersion: process.version,
		platform: process.platform,
		arch: process.arch,
		env: process.env.NODE_ENV || 'development'
	});
};
