import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rateLimiter } from '$lib/server/ratelimit';

/**
 * Reset rate limiter state - only available when ALLOW_RATE_LIMIT_RESET=true
 * Used for E2E test isolation
 */
export const POST: RequestHandler = async () => {
	if (process.env.ALLOW_RATE_LIMIT_RESET !== 'true') {
		throw error(403, 'Not available');
	}
	rateLimiter.clear();
	return json({ success: true });
};
