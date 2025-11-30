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

	// Protected routes
	const protectedRoutes = ['/', '/share-existing'];
	const protectedAPIs = ['/api/upload', '/api/shared'];

	// Check if route is protected
	const isProtectedRoute = protectedRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	const isProtectedAPI = protectedAPIs.some((api) => event.url.pathname.startsWith(api));

	// Allow public routes (login, download, auth APIs)
	if (
		event.url.pathname === '/login' ||
		event.url.pathname.startsWith('/download/') ||
		event.url.pathname.startsWith('/api/auth/')
	) {
		return resolve(event);
	}

	// Redirect to login if accessing protected route without auth
	if (isProtectedRoute && !session) {
		throw redirect(302, '/login');
	}

	// Return 401 for protected API calls without auth
	if (isProtectedAPI && !session) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return resolve(event);
};

// Combine all middleware
export const handle: Handle = sequence(httpsRedirect, securityHeaders, authMiddleware);
