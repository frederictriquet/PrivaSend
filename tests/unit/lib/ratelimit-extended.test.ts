import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter } from '../../../src/lib/server/ratelimit';

describe('RateLimiter Extended Tests', () => {
	beforeEach(() => {
		rateLimiter.clear();
	});

	describe('concurrent requests', () => {
		it('should handle rapid successive requests', () => {
			const key = 'rapid-test';
			const max = 10;
			let allowed = 0;

			for (let i = 0; i < 20; i++) {
				if (rateLimiter.check(key, max, 60000)) {
					allowed++;
				}
			}

			expect(allowed).toBe(max);
		});

		it('should handle multiple different keys', () => {
			const keys = ['key1', 'key2', 'key3', 'key4', 'key5'];

			keys.forEach((key) => {
				expect(rateLimiter.check(key, 5, 60000)).toBe(true);
			});

			// Each key should be independent
			keys.forEach((key) => {
				expect(rateLimiter.remaining(key, 5)).toBe(4);
			});
		});
	});

	describe('edge cases', () => {
		it('should handle maxRequests of 1', () => {
			const key = 'single-request';
			expect(rateLimiter.check(key, 1, 60000)).toBe(true);
			expect(rateLimiter.check(key, 1, 60000)).toBe(false);
		});

		it('should handle very large maxRequests', () => {
			const key = 'large-limit';
			const max = 10000;

			for (let i = 0; i < 100; i++) {
				expect(rateLimiter.check(key, max, 60000)).toBe(true);
			}

			expect(rateLimiter.remaining(key, max)).toBe(max - 100);
		});

		it('should handle very short windows', () => {
			const key = 'short-window';
			rateLimiter.check(key, 1, 10); // 10ms window

			return new Promise((resolve) => {
				setTimeout(() => {
					// Should reset after 10ms
					expect(rateLimiter.check(key, 1, 10)).toBe(true);
					resolve(undefined);
				}, 20);
			});
		});

		it('should handle zero remaining correctly', () => {
			const key = 'zero-test';
			const max = 3;

			// Fill limit
			for (let i = 0; i < max; i++) {
				rateLimiter.check(key, max, 60000);
			}

			expect(rateLimiter.remaining(key, max)).toBe(0);
			expect(rateLimiter.check(key, max, 60000)).toBe(false);
		});
	});

	describe('cleanup behavior', () => {
		it('should handle clear during active limits', () => {
			const key = 'clear-test';
			rateLimiter.check(key, 5, 60000);
			rateLimiter.check(key, 5, 60000);

			expect(rateLimiter.remaining(key, 5)).toBe(3);

			rateLimiter.clear();

			expect(rateLimiter.remaining(key, 5)).toBe(5);
		});
	});

	describe('window expiration', () => {
		it('should handle partial window expiration', () => {
			const key1 = 'short-window';
			const key2 = 'long-window';

			rateLimiter.check(key1, 5, 50); // 50ms
			rateLimiter.check(key2, 5, 10000); // 10s

			return new Promise((resolve) => {
				setTimeout(() => {
					// key1 should reset, key2 should not
					expect(rateLimiter.remaining(key1, 5)).toBe(5);
					expect(rateLimiter.remaining(key2, 5)).toBe(4);
					resolve(undefined);
				}, 100);
			});
		});
	});

	describe('resetAt timing', () => {
		it('should have consistent reset time', () => {
			const key = 'timing-test';
			const windowMs = 60000;
			const before = Date.now();

			rateLimiter.check(key, 5, windowMs);

			const resetAt = rateLimiter.resetAt(key);
			expect(resetAt).toBeDefined();
			expect(resetAt! - before).toBeGreaterThanOrEqual(windowMs - 100); // Allow 100ms tolerance
			expect(resetAt! - before).toBeLessThanOrEqual(windowMs + 100);
		});

		it('should update reset time on window expiration', () => {
			const key = 'update-test';

			rateLimiter.check(key, 5, 50);
			const firstReset = rateLimiter.resetAt(key);

			return new Promise((resolve) => {
				setTimeout(() => {
					rateLimiter.check(key, 5, 50);
					const secondReset = rateLimiter.resetAt(key);

					expect(secondReset).toBeGreaterThan(firstReset!);
					resolve(undefined);
				}, 100);
			});
		});
	});
});
