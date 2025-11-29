import { cleanupService } from '$lib/server/cleanup';
import { sequence } from '@sveltejs/kit/hooks';
import { securityHeaders, httpsRedirect } from '$lib/server/security';
import type { Handle } from '@sveltejs/kit';

// Start cleanup service when server starts
cleanupService.start();

// Combine all middleware
export const handle: Handle = sequence(httpsRedirect, securityHeaders);
