import type { Handle } from '@sveltejs/kit';

/**
 * Security middleware for HTTP headers and request validation
 */
export const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()'
	);

	// Content Security Policy
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'", // unsafe-inline needed for Svelte
			"style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Svelte
			"img-src 'self' data: blob:",
			"font-src 'self' data:",
			"connect-src 'self'",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);

	// HSTS (HTTP Strict Transport Security) - only in production with HTTPS
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	return response;
};

/**
 * Enforce HTTPS in production
 */
export const httpsRedirect: Handle = async ({ event, resolve }) => {
	const proto = event.request.headers.get('x-forwarded-proto');

	// In production, redirect HTTP to HTTPS
	if (process.env.NODE_ENV === 'production' && proto === 'http') {
		const httpsUrl = event.url.toString().replace('http://', 'https://');
		return new Response(null, {
			status: 301,
			headers: {
				location: httpsUrl
			}
		});
	}

	return resolve(event);
};

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
	let sanitized = input;

	// Remove dangerous characters - loop to handle nested attempts
	while (sanitized !== (sanitized = sanitized.replace(/[<>]/g, '')));

	// Remove javascript: protocol - loop to handle obfuscation like jajavascript:vascript:
	while (sanitized !== (sanitized = sanitized.replace(/javascript:/gi, '')));

	// Remove all URL schemes that could be dangerous
	sanitized = sanitized.replace(/\b(javascript|data|vbscript|about):/gi, '');

	// Remove event handlers - more comprehensive
	sanitized = sanitized.replace(/\s*on\w+\s*=/gi, '');

	return sanitized.trim();
}

/**
 * Validate filename for security
 */
export function sanitizeFilename(filename: string): string {
	// Remove path traversal attempts
	let sanitized = filename.replace(/\.\./g, '');

	// Remove potentially dangerous characters
	sanitized = sanitized.replace(/[/\\]/g, '_');

	// Limit length
	if (sanitized.length > 255) {
		const ext = sanitized.split('.').pop() || '';
		const nameWithoutExt = sanitized.substring(0, 255 - ext.length - 1);
		sanitized = `${nameWithoutExt}.${ext}`;
	}

	return sanitized || 'unnamed_file';
}

/**
 * Validate MIME type against whitelist
 */
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
	// If no restrictions, allow all
	if (allowedTypes.length === 0) return true;

	// Exact match
	if (allowedTypes.includes(mimeType)) return true;

	// Wildcard match (e.g., image/*)
	const category = mimeType.split('/')[0];
	if (allowedTypes.includes(`${category}/*`)) return true;

	return false;
}

/**
 * Detect potentially dangerous file extensions
 */
export function hasDangerousExtension(filename: string): boolean {
	const dangerous = [
		'.exe',
		'.bat',
		'.cmd',
		'.com',
		'.pif',
		'.scr',
		'.vbs',
		'.js',
		'.jse',
		'.wsf',
		'.wsh',
		'.ps1',
		'.psm1',
		'.sh',
		'.bash',
		'.csh',
		'.jar',
		'.app',
		'.deb',
		'.rpm'
	];

	const ext = filename.toLowerCase().split('.').pop() || '';
	return dangerous.includes(`.${ext}`);
}
