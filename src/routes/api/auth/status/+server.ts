import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthService } from '$lib/server/auth';

/**
 * Auth status endpoint
 * GET /api/auth/status
 */
export const GET: RequestHandler = async (event) => {
	return json({
		authEnabled: AuthService.isEnabled(),
		authenticated: event.locals.isAuthenticated || false
	});
};
