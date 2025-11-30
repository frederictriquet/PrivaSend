import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SessionService } from '$lib/server/session';

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
export const POST: RequestHandler = async (event) => {
	const session = SessionService.getSessionFromCookie(event);

	if (session) {
		SessionService.destroySession(session.id);
		console.log(`User logged out from ${event.getClientAddress()}`);
	}

	SessionService.clearSessionCookie(event);

	return json({ success: true });
};
