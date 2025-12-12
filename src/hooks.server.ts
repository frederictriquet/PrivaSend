import { cleanupService } from '$lib/server/cleanup';
import { sequence } from '@sveltejs/kit/hooks';
import { securityHeaders, httpsRedirect } from '$lib/server/security';
import { SessionService } from '$lib/server/session';
import { AuthService } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

// Start cleanup service when server starts
cleanupService.start();

// Initialize auth service on startup
AuthService.initialize();

// Authentication middleware
const authMiddleware: Handle = async ({ event, resolve }) => {
	// Skip auth check if disabled
	if (!AuthService.isEnabled()) {
		event.locals.session = null;
		event.locals.isAuthenticated = false;
		return resolve(event);
	}

	// Get session from cookie
	const session = SessionService.getSessionFromCookie(event);

	// Attach session to locals for use in endpoints
	event.locals.session = session;
	event.locals.isAuthenticated = session !== null;

	// Public routes (explicitly allowed without auth)
	const publicRoutes = ['/login'];
	const publicPaths = ['/download/', '/api/auth/'];

	// Check if route is public
	const isPublicRoute = publicRoutes.includes(event.url.pathname);
	const isPublicPath = publicPaths.some((path) => event.url.pathname.startsWith(path));

	// Allow public routes
	if (isPublicRoute || isPublicPath) {
		return resolve(event);
	}

	// Require authentication for all other routes and APIs
	if (!session) {
		// API calls get 401
		if (event.url.pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Page requests redirect to login
		throw redirect(302, '/login');
	}

	return resolve(event);
};

// Combine all middleware
export const handle: Handle = sequence(httpsRedirect, securityHeaders, authMiddleware);
