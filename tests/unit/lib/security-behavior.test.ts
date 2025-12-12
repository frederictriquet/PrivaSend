import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '$lib/server/security';

describe('Security - Exact Behavior', () => {
	describe('sanitizeFilename - Verified Behavior', () => {
		it('replaces .. with empty string', () => {
			expect(sanitizeFilename('..')).toBe('unnamed_file');
		});

		it('replaces / with _', () => {
			expect(sanitizeFilename('a/b')).toBe('a_b');
		});

		it('replaces \\\\ with _', () => {
			expect(sanitizeFilename('a\\b')).toBe('a_b');
		});

		it('handles ../../../etc/passwd', () => {
			expect(sanitizeFilename('../../../etc/passwd')).toBe('___etc_passwd');
		});

		it('handles ///', () => {
			expect(sanitizeFilename('///')).toBe('___');
		});

		it('returns unnamed_file for empty string', () => {
			expect(sanitizeFilename('')).toBe('unnamed_file');
		});

		it('preserves safe filename', () => {
			expect(sanitizeFilename('file.txt')).toBe('file.txt');
		});

		it('truncates at 255 chars preserving extension', () => {
			const long = 'a'.repeat(300) + '.txt';
			const result = sanitizeFilename(long);
			expect(result.length).toBeLessThanOrEqual(255);
			expect(result.endsWith('.txt')).toBe(true);
		});
	});
});
