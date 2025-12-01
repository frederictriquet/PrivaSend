import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SessionService } from '$lib/server/session';
import { AuditService } from '$lib/server/audit';

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
export const POST: RequestHandler = async (event) => {
	const session = SessionService.getSessionFromCookie(event);

	if (session) {
		SessionService.destroySession(session.id);
		// Log logout
		AuditService.logAuth('logout', 'success', event.getClientAddress(), {
			sessionId: session.id
		});
	}

	SessionService.clearSessionCookie(event);

	return json({ success: true });
};
