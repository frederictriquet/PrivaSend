import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter, rateLimitConfig } from '../../../src/lib/server/ratelimit';

describe('RateLimiter', () => {
	beforeEach(() => {
		// Clear rate limiter before each test
		rateLimiter.clear();
	});

	describe('check', () => {
		it('should allow first request', () => {
			const allowed = rateLimiter.check('test-key', 5, 60000);
			expect(allowed).toBe(true);
		});

		it('should allow requests within limit', () => {
			const key = 'test-limit';
			const maxRequests = 3;

			for (let i = 0; i < maxRequests; i++) {
				const allowed = rateLimiter.check(key, maxRequests, 60000);
				expect(allowed).toBe(true);
			}
		});

		it('should block requests exceeding limit', () => {
			const key = 'test-exceed';
			const maxRequests = 2;

			// First 2 should pass
			expect(rateLimiter.check(key, maxRequests, 60000)).toBe(true);
			expect(rateLimiter.check(key, maxRequests, 60000)).toBe(true);

			// 3rd should be blocked
			expect(rateLimiter.check(key, maxRequests, 60000)).toBe(false);
		});

		it('should reset after window expires', () => {
			const key = 'test-reset';
			const windowMs = 100; // 100ms window

			// Fill the limit
			rateLimiter.check(key, 1, windowMs);

			// Should be blocked immediately
			expect(rateLimiter.check(key, 1, windowMs)).toBe(false);

			// Wait for window to expire
			return new Promise((resolve) => {
				setTimeout(() => {
					// Should be allowed again
					expect(rateLimiter.check(key, 1, windowMs)).toBe(true);
					resolve(undefined);
				}, 150);
			});
		});
	});

	describe('remaining', () => {
		it('should return max requests for new key', () => {
			const remaining = rateLimiter.remaining('new-key', 10);
			expect(remaining).toBe(10);
		});

		it('should return correct remaining count', () => {
			const key = 'remaining-test';
			const max = 5;

			rateLimiter.check(key, max, 60000);
			rateLimiter.check(key, max, 60000);

			const remaining = rateLimiter.remaining(key, max);
			expect(remaining).toBe(3);
		});

		it('should return 0 when limit exceeded', () => {
			const key = 'zero-remaining';
			const max = 2;

			rateLimiter.check(key, max, 60000);
			rateLimiter.check(key, max, 60000);
			rateLimiter.check(key, max, 60000);

			const remaining = rateLimiter.remaining(key, max);
			expect(remaining).toBe(0);
		});
	});

	describe('resetAt', () => {
		it('should return null for new key', () => {
			const resetAt = rateLimiter.resetAt('new-key');
			expect(resetAt).toBeNull();
		});

		it('should return reset timestamp', () => {
			const key = 'reset-test';
			const before = Date.now();

			rateLimiter.check(key, 5, 60000);

			const resetAt = rateLimiter.resetAt(key);
			expect(resetAt).toBeDefined();
			expect(resetAt).toBeGreaterThan(before);
		});
	});

	describe('clear', () => {
		it('should clear all entries', () => {
			rateLimiter.check('key1', 5, 60000);
			rateLimiter.check('key2', 5, 60000);

			rateLimiter.clear();

			expect(rateLimiter.remaining('key1', 5)).toBe(5);
			expect(rateLimiter.remaining('key2', 5)).toBe(5);
		});
	});
});

describe('rateLimitConfig', () => {
	it('should have upload configuration', () => {
		expect(rateLimitConfig.upload).toBeDefined();
		expect(rateLimitConfig.upload.maxRequests).toBeGreaterThan(0);
		expect(rateLimitConfig.upload.windowMs).toBeGreaterThan(0);
	});

	it('should have download configuration', () => {
		expect(rateLimitConfig.download).toBeDefined();
		expect(rateLimitConfig.download.maxRequests).toBeGreaterThan(0);
	});

	it('should have api configuration', () => {
		expect(rateLimitConfig.api).toBeDefined();
		expect(rateLimitConfig.api.maxRequests).toBeGreaterThan(0);
	});
});
