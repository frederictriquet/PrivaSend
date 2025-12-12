import { describe, it, expect, vi } from 'vitest';
import { securityHeaders, httpsRedirect, sanitizeFilename } from '$lib/server/security';

describe('Security Headers - Mutation Testing', () => {
	describe('securityHeaders middleware', () => {
		it('should set X-Frame-Options to DENY', async () => {
			const mockEvent = { url: new URL('http://localhost') } as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('test'));

			const response = await securityHeaders({ event: mockEvent, resolve: mockResolve });

			expect(response.headers.get('X-Frame-Options')).toBe('DENY');
		});

		it('should set X-Content-Type-Options to nosniff', async () => {
			const mockEvent = { url: new URL('http://localhost') } as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('test'));

			const response = await securityHeaders({ event: mockEvent, resolve: mockResolve });

			expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		});

		it('should set CSP default-src to self', async () => {
			const mockEvent = { url: new URL('http://localhost') } as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('test'));

			const response = await securityHeaders({ event: mockEvent, resolve: mockResolve });
			const csp = response.headers.get('Content-Security-Policy');

			expect(csp).toContain("default-src 'self'");
		});

		it('should set HSTS when using HTTPS', async () => {
			const mockEvent = { url: new URL('https://localhost') } as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('test'));

			const response = await securityHeaders({ event: mockEvent, resolve: mockResolve });

			expect(response.headers.get('Strict-Transport-Security')).toBe(
				'max-age=31536000; includeSubDomains'
			);
		});

		it('should NOT set HSTS when using HTTP', async () => {
			const mockEvent = { url: new URL('http://localhost') } as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('test'));

			const response = await securityHeaders({ event: mockEvent, resolve: mockResolve });

			expect(response.headers.get('Strict-Transport-Security')).toBeNull();
		});
	});

	describe('httpsRedirect middleware', () => {
		it('should redirect HTTP to HTTPS in production', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const mockEvent = {
				url: new URL('http://example.com/path'),
				request: { headers: { get: () => 'http' } }
			} as unknown;
			const mockResolve = vi.fn();

			const response = await httpsRedirect({ event: mockEvent, resolve: mockResolve });

			expect(response.status).toBe(301);
			expect(response.headers.get('location')).toBe('https://example.com/path');
			expect(mockResolve).not.toHaveBeenCalled();

			process.env.NODE_ENV = originalEnv;
		});

		it('should NOT redirect when already HTTPS', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const mockEvent = {
				url: new URL('https://example.com'),
				request: { headers: { get: () => 'https' } }
			} as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('ok'));

			const response = await httpsRedirect({ event: mockEvent, resolve: mockResolve });

			expect(mockResolve).toHaveBeenCalled();

			process.env.NODE_ENV = originalEnv;
		});

		it('should NOT redirect in development', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'development';

			const mockEvent = {
				url: new URL('http://localhost'),
				request: { headers: { get: () => 'http' } }
			} as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('ok'));

			await httpsRedirect({ event: mockEvent, resolve: mockResolve });

			expect(mockResolve).toHaveBeenCalled();

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe('sanitizeFilename - Boundary Tests', () => {
		it('should truncate at exactly 255 chars', () => {
			const longName = 'a'.repeat(256) + '.txt';
			const result = sanitizeFilename(longName);
			expect(result.length).toBeLessThanOrEqual(255);
		});

		it('should NOT truncate at 254 chars', () => {
			const name = 'a'.repeat(250) + '.txt';
			const result = sanitizeFilename(name);
			expect(result).toBe(name);
		});

		it('should handle exactly 255 chars', () => {
			const name = 'a'.repeat(251) + '.txt';
			const result = sanitizeFilename(name);
			expect(result).toBe(name);
		});
	});
});

describe('Security - Final Mutation Killers', () => {
	describe('CSP frame-ancestors', () => {
		it('should set frame-ancestors to none', async () => {
			const mockEvent = { url: new URL('http://localhost') } as unknown;
			const mockResolve = vi.fn().mockResolvedValue(new Response('test'));

			const response = await securityHeaders({
				event: mockEvent as unknown,
				resolve: mockResolve
			});
			const csp = response.headers.get('Content-Security-Policy');

			expect(csp).toContain("frame-ancestors 'none'");
		});
	});

	describe('HTTPS redirect header check', () => {
		it('should check x-forwarded-proto header', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const mockEvent = {
				url: new URL('http://example.com'),
				request: {
					headers: { get: (name: string) => (name === 'x-forwarded-proto' ? 'http' : null) }
				}
			} as unknown;

			const response = await httpsRedirect({ event: mockEvent as unknown, resolve: vi.fn() });
			expect(response.status).toBe(301);

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe('sanitizeFilename - Boundary at 255', () => {
		it('should truncate ONLY when > 255', () => {
			const exactly255 = 'a'.repeat(251) + '.txt';
			expect(sanitizeFilename(exactly255).length).toBe(255);
			expect(sanitizeFilename(exactly255)).toBe(exactly255);
		});

		it('should truncate when = 256', () => {
			const exactly256 = 'a'.repeat(252) + '.txt';
			const result = sanitizeFilename(exactly256);
			expect(result.length).toBe(255);
			expect(result).not.toBe(exactly256);
		});
	});

	describe('Extension extraction', () => {
		it('should handle filename without extension', () => {
			const result = sanitizeFilename('README');
			expect(result).toBe('README');
		});

		it('should handle empty extension', () => {
			const result = sanitizeFilename('file.');
			expect(result).toBe('file.');
		});
	});
});
