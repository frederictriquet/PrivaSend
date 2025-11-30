import { describe, it, expect } from 'vitest';

describe('Date Helpers', () => {
	describe('expiration calculations', () => {
		it('should add days to date', () => {
			const now = new Date('2025-11-30T00:00:00Z');
			const future = new Date(now);
			future.setDate(future.getDate() + 7);

			expect(future.getDate()).toBe(now.getDate() + 7);
		});

		it('should handle month boundary', () => {
			const endOfMonth = new Date('2025-11-30T00:00:00Z');
			const nextMonth = new Date(endOfMonth);
			nextMonth.setDate(nextMonth.getDate() + 7);

			expect(nextMonth.getMonth()).toBe(11); // December (0-indexed)
		});

		it('should handle year boundary', () => {
			const endOfYear = new Date('2025-12-30T00:00:00Z');
			const nextYear = new Date(endOfYear);
			nextYear.setDate(nextYear.getDate() + 7);

			expect(nextYear.getFullYear()).toBe(2026);
		});

		it('should calculate time difference', () => {
			const now = new Date();
			const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

			const diff = future.getTime() - now.getTime();
			const days = Math.floor(diff / (24 * 60 * 60 * 1000));

			expect(days).toBe(7);
		});

		it('should detect expired vs valid', () => {
			const now = new Date();
			const past = new Date(now.getTime() - 1000);
			const future = new Date(now.getTime() + 1000);

			expect(past < now).toBe(true);
			expect(future > now).toBe(true);
		});
	});

	describe('time remaining calculations', () => {
		it('should calculate days remaining', () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

			const remaining = expiresAt.getTime() - now.getTime();
			const days = Math.floor(remaining / (1000 * 60 * 60 * 24));

			expect(days).toBeGreaterThanOrEqual(6);
			expect(days).toBeLessThanOrEqual(7);
		});

		it('should calculate hours remaining', () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 5 * 60 * 60 * 1000);

			const remaining = expiresAt.getTime() - now.getTime();
			const hours = Math.floor(remaining / (1000 * 60 * 60));

			expect(hours).toBeGreaterThanOrEqual(4);
			expect(hours).toBeLessThanOrEqual(5);
		});

		it('should handle expired time', () => {
			const now = new Date();
			const expired = new Date(now.getTime() - 1000);

			const remaining = expired.getTime() - now.getTime();

			expect(remaining).toBeLessThan(0);
		});
	});

	describe('ISO date string conversions', () => {
		it('should convert to ISO string', () => {
			const date = new Date('2025-11-30T12:00:00Z');
			const iso = date.toISOString();

			expect(iso).toContain('2025-11-30');
			expect(iso).toContain('T');
			expect(iso).toContain('Z');
		});

		it('should parse ISO string', () => {
			const iso = '2025-11-30T12:00:00.000Z';
			const date = new Date(iso);

			expect(date.toISOString()).toBe(iso);
		});

		it('should handle round-trip conversion', () => {
			const original = new Date();
			const iso = original.toISOString();
			const parsed = new Date(iso);

			expect(parsed.getTime()).toBe(original.getTime());
		});
	});
});

describe('getClientId', () => {
	it('should prefer x-forwarded-for', () => {
		const mockEvent = {
			request: {
				headers: {
					get: (name: string) => {
						if (name === 'x-forwarded-for') return '1.2.3.4';
						if (name === 'x-real-ip') return '5.6.7.8';
						return null;
					}
				}
			},
			getClientAddress: () => '9.9.9.9'
		} as any;

		const result = getClientId(mockEvent);
		expect(result).toBe('1.2.3.4');
	});

	it('should use x-real-ip if no x-forwarded-for', () => {
		const mockEvent = {
			request: {
				headers: {
					get: (name: string) => {
						if (name === 'x-real-ip') return '5.6.7.8';
						return null;
					}
				}
			},
			getClientAddress: () => '9.9.9.9'
		} as any;

		const result = getClientId(mockEvent);
		expect(result).toBe('5.6.7.8');
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

		const result = getClientId(mockEvent);
		expect(result).toBe('127.0.0.1');
	});

	it('should handle IPv6 addresses', () => {
		const mockEvent = {
			request: {
				headers: {
					get: (name: string) => {
						if (name === 'x-forwarded-for') return '::1';
						return null;
					}
				}
			},
			getClientAddress: () => '127.0.0.1'
		} as any;

		const result = getClientId(mockEvent);
		expect(result).toBe('::1');
	});

	it('should trim whitespace from forwarded IP', () => {
		const mockEvent = {
			request: {
				headers: {
					get: (name: string) => {
						if (name === 'x-forwarded-for') return '  192.168.1.1  ';
						return null;
					}
				}
			},
			getClientAddress: () => '127.0.0.1'
		} as any;

		const result = getClientId(mockEvent);
		expect(result).toBe('192.168.1.1');
	});

	it('should handle multiple IPs in x-forwarded-for', () => {
		const mockEvent = {
			request: {
				headers: {
					get: (name: string) => {
						if (name === 'x-forwarded-for') return '1.1.1.1, 2.2.2.2, 3.3.3.3';
						return null;
					}
				}
			},
			getClientAddress: () => '127.0.0.1'
		} as any;

		const result = getClientId(mockEvent);
		expect(result).toBe('1.1.1.1'); // Should use first IP
	});
});
