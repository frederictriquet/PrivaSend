import { describe, it, expect } from 'vitest';
import { sanitizeFilename, isValidMimeType, hasDangerousExtension } from '$lib/server/security';

describe('Security - Real Import Tests', () => {
	describe('sanitizeFilename', () => {
		it('should sanitize simple filename', () => {
			const result = sanitizeFilename('test.txt');
			expect(result).toBe('test.txt');
		});

		it('should remove path traversal', () => {
			const result = sanitizeFilename('../../../etc/passwd');
			expect(result).not.toContain('..');
		});
	});

	describe('isValidMimeType', () => {
		it('should accept image/png', () => {
			const result = isValidMimeType('image/png', []);
			expect(result).toBe(true);
		});

		it('should accept when allowedTypes is empty', () => {
			const result = isValidMimeType('application/pdf', []);
			expect(result).toBe(true);
		});
	});

	describe('hasDangerousExtension', () => {
		it('should detect .exe', () => {
			const result = hasDangerousExtension('virus.exe');
			expect(result).toBe(true);
		});

		it('should allow .txt', () => {
			const result = hasDangerousExtension('safe.txt');
			expect(result).toBe(false);
		});
	});
});
