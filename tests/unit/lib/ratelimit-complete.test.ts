import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter, getClientId } from '../../../src/lib/server/ratelimit';

describe('RateLimiter - Complete Coverage', () => {
	beforeEach(() => {
		rateLimiter.clear();
	});

	describe('all code paths', () => {
		it('should create new window on first check', () => {
			const result = rateLimiter.check('new-key', 10, 60000);
			expect(result).toBe(true);
			expect(rateLimiter.remaining('new-key', 10)).toBe(9);
		});

		it('should reset window when expired', () => {
			const key = 'expired-window';

			// Create entry with very short window
			rateLimiter.check(key, 5, 1); // 1ms window

			// Wait for expiration
			return new Promise((resolve) => {
				setTimeout(() => {
					// Should create new window
					const result = rateLimiter.check(key, 5, 60000);
					expect(result).toBe(true);
					expect(rateLimiter.remaining(key, 5)).toBe(4);
					resolve(undefined);
				}, 10);
			});
		});

		it('should increment count within window', () => {
			const key = 'increment-test';

			rateLimiter.check(key, 10, 60000);
			expect(rateLimiter.remaining(key, 10)).toBe(9);

			rateLimiter.check(key, 10, 60000);
			expect(rateLimiter.remaining(key, 10)).toBe(8);

			rateLimiter.check(key, 10, 60000);
			expect(rateLimiter.remaining(key, 10)).toBe(7);
		});

		it('should block when at max', () => {
			const key = 'max-test';
			const max = 3;

			// Fill to max
			for (let i = 0; i < max; i++) {
				expect(rateLimiter.check(key, max, 60000)).toBe(true);
			}

			// Should be blocked
			expect(rateLimiter.check(key, max, 60000)).toBe(false);
			expect(rateLimiter.check(key, max, 60000)).toBe(false);
		});

		it('should return correct remaining at each step', () => {
			const key = 'step-test';
			const max = 5;

			expect(rateLimiter.remaining(key, max)).toBe(max); // Not checked yet

			rateLimiter.check(key, max, 60000);
			expect(rateLimiter.remaining(key, max)).toBe(4);

			rateLimiter.check(key, max, 60000);
			expect(rateLimiter.remaining(key, max)).toBe(3);

			rateLimiter.check(key, max, 60000);
			expect(rateLimiter.remaining(key, max)).toBe(2);
		});

		it('should handle resetAt for non-existent key', () => {
			const result = rateLimiter.resetAt('never-checked');
			expect(result).toBeNull();
		});

		it('should handle resetAt for existing key', () => {
			const key = 'reset-key';
			rateLimiter.check(key, 5, 60000);

			const resetAt = rateLimiter.resetAt(key);
			expect(resetAt).not.toBeNull();
			expect(resetAt).toBeGreaterThan(Date.now());
		});
	});

	describe('getClientId', () => {
		it('should extract IP from x-forwarded-for', () => {
			const mockEvent = {
				request: {
					headers: {
						get: (name: string) => {
							if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
							return null;
						}
					}
				},
				getClientAddress: () => '127.0.0.1'
			} as any;

			const ip = getClientId(mockEvent);
			expect(ip).toBe('192.168.1.1');
		});

		it('should extract IP from x-real-ip', () => {
			const mockEvent = {
				request: {
					headers: {
						get: (name: string) => {
							if (name === 'x-real-ip') return '192.168.1.100';
							return null;
						}
					}
				},
				getClientAddress: () => '127.0.0.1'
			} as any;

			const ip = getClientId(mockEvent);
			expect(ip).toBe('192.168.1.100');
		});

		it('should fallback to getClientAddress', () => {
			const mockEvent = {
				request: {
					headers: {
						get: () => null
					}
				},
				getClientAddress: () => '127.0.0.1'
			} as any;

			const ip = getClientId(mockEvent);
			expect(ip).toBe('127.0.0.1');
		});

		it('should handle x-forwarded-for with spaces', () => {
			const mockEvent = {
				request: {
					headers: {
						get: (name: string) => {
							if (name === 'x-forwarded-for') return '  192.168.1.1  , 10.0.0.1';
							return null;
						}
					}
				},
				getClientAddress: () => '127.0.0.1'
			} as any;

			const ip = getClientId(mockEvent);
			expect(ip).toBe('192.168.1.1');
		});
	});
});
