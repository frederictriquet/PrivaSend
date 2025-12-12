import type { RequestEvent } from '@sveltejs/kit';

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis
 */
class RateLimiter {
	private limits: Map<string, RateLimitEntry> = new Map();
	private cleanupInterval: NodeJS.Timeout;

	constructor() {
		// Cleanup old entries every 5 minutes
		this.cleanupInterval = setInterval(
			() => {
				this.cleanup();
			},
			5 * 60 * 1000
		);
	}

	/**
	 * Check if request is allowed
	 */
	check(key: string, maxRequests: number, windowMs: number): boolean {
		const now = Date.now();
		const entry = this.limits.get(key);

		if (!entry || entry.resetAt < now) {
			// New window
			this.limits.set(key, {
				count: 1,
				resetAt: now + windowMs
			});
			return true;
		}

		if (entry.count >= maxRequests) {
			// Rate limit exceeded
			return false;
		}

		// Increment count
		entry.count++;
		return true;
	}

	/**
	 * Get remaining requests for a key
	 */
	remaining(key: string, maxRequests: number): number {
		const entry = this.limits.get(key);
		if (!entry) return maxRequests;

		return Math.max(0, maxRequests - entry.count);
	}

	/**
	 * Get reset time for a key
	 */
	resetAt(key: string): number | null {
		const entry = this.limits.get(key);
		return entry ? entry.resetAt : null;
	}

	/**
	 * Clean up expired entries
	 */
	private cleanup() {
		const now = Date.now();
		for (const [key, entry] of this.limits.entries()) {
			if (entry.resetAt < now) {
				this.limits.delete(key);
			}
		}
	}

	/**
	 * Clear all entries (for testing)
	 */
	clear() {
		this.limits.clear();
	}

	/**
	 * Destroy rate limiter
	 */
	destroy() {
		clearInterval(this.cleanupInterval);
		this.limits.clear();
	}
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 */
export const rateLimitConfig = {
	upload: {
		maxRequests: 100, // 100 uploads
		windowMs: 60 * 60 * 1000 // per hour
	},
	download: {
		maxRequests: 100, // 100 downloads
		windowMs: 60 * 60 * 1000 // per hour
	},
	api: {
		maxRequests: 60, // 60 requests
		windowMs: 60 * 1000 // per minute
	},
	login: {
		maxRequests: 3, // 3 login attempts
		windowMs: 60 * 1000 // per minute
	}
};

/**
 * Get client identifier (IP address)
 */
export function getClientId(event: RequestEvent): string {
	// Try to get real IP from headers (for reverse proxy)
	const forwardedFor = event.request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		return forwardedFor.split(',')[0].trim();
	}

	const realIp = event.request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	// Fallback to client address
	return event.getClientAddress();
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
	event: RequestEvent,
	type: keyof typeof rateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number | null } {
	const clientId = getClientId(event);
	const key = `${type}:${clientId}`;
	const config = rateLimitConfig[type];

	const allowed = rateLimiter.check(key, config.maxRequests, config.windowMs);
	const remaining = rateLimiter.remaining(key, config.maxRequests);
	const resetAt = rateLimiter.resetAt(key);

	return { allowed, remaining, resetAt };
}
