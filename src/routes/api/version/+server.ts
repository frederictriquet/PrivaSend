import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJsonPath = join(__dirname, '../../../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

/**
 * Get application version and info
 * GET /api/version
 */
export const GET: RequestHandler = async () => {
	return json({
		name: packageJson.name,
		version: packageJson.version,
		nodeVersion: process.version,
		platform: process.platform,
		arch: process.arch,
		env: process.env.NODE_ENV || 'development'
	});
};
