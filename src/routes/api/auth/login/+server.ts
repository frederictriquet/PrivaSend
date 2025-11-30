import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthService } from '$lib/server/auth';
import { SessionService } from '$lib/server/session';
import { checkRateLimit } from '$lib/server/ratelimit';

/**
 * Login endpoint
 * POST /api/auth/login
 */
export const POST: RequestHandler = async (event) => {
	// Rate limiting
	const rateLimit = checkRateLimit(event, 'login');
	if (!rateLimit.allowed) {
		throw error(429, 'Too many login attempts. Please try again later.');
	}

	try {
		const { password } = await event.request.json();

		if (!password) {
			throw error(400, 'Password is required');
		}

		// Verify password
		const isValid = await AuthService.verifyPassword(password);

		if (!isValid) {
			console.log(`Failed login attempt from ${event.getClientAddress()}`);
			throw error(401, 'Invalid password');
		}

		// Create session
		const session = SessionService.createSession();
		SessionService.setSessionCookie(event, session.id);

		console.log(`Successful login from ${event.getClientAddress()}`);

		return json({
			success: true,
			expiresAt: session.expiresAt.toISOString()
		});
	} catch (err) {
		console.error('Login error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Login failed');
	}
};
