import { describe, it, expect } from 'vitest';
import { sanitizeFilename, hasDangerousExtension, isValidMimeType } from '../../../src/lib/server/security';

describe('Security Utils', () => {
	describe('sanitizeFilename', () => {
		it('should remove path traversal attempts', () => {
			expect(sanitizeFilename('../../../etc/passwd')).toBe('___etc_passwd');
		});

		it('should remove forward slashes', () => {
			expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
		});

		it('should remove backslashes', () => {
			expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
		});

		it('should handle normal filenames', () => {
			expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
		});

		it('should limit filename length to 255 chars', () => {
			const longName = 'a'.repeat(300) + '.txt';
			const result = sanitizeFilename(longName);
			expect(result.length).toBeLessThanOrEqual(255);
		});

		it('should return unnamed_file for empty input', () => {
			expect(sanitizeFilename('')).toBe('unnamed_file');
		});
	});

	describe('hasDangerousExtension', () => {
		it('should detect .exe files', () => {
			expect(hasDangerousExtension('malware.exe')).toBe(true);
		});

		it('should detect .sh files', () => {
			expect(hasDangerousExtension('script.sh')).toBe(true);
		});

		it('should detect .bat files', () => {
			expect(hasDangerousExtension('script.bat')).toBe(true);
		});

		it('should allow .pdf files', () => {
			expect(hasDangerousExtension('document.pdf')).toBe(false);
		});

		it('should allow .jpg files', () => {
			expect(hasDangerousExtension('photo.jpg')).toBe(false);
		});

		it('should be case insensitive', () => {
			expect(hasDangerousExtension('MALWARE.EXE')).toBe(true);
		});
	});

	describe('isValidMimeType', () => {
		it('should allow all types when allowedTypes is empty', () => {
			expect(isValidMimeType('application/pdf', [])).toBe(true);
			expect(isValidMimeType('image/jpeg', [])).toBe(true);
		});

		it('should validate exact match', () => {
			expect(isValidMimeType('application/pdf', ['application/pdf'])).toBe(true);
			expect(isValidMimeType('image/jpeg', ['application/pdf'])).toBe(false);
		});

		it('should validate wildcard match', () => {
			expect(isValidMimeType('image/jpeg', ['image/*'])).toBe(true);
			expect(isValidMimeType('image/png', ['image/*'])).toBe(true);
			expect(isValidMimeType('application/pdf', ['image/*'])).toBe(false);
		});

		it('should handle multiple allowed types', () => {
			const allowed = ['image/*', 'application/pdf'];
			expect(isValidMimeType('image/jpeg', allowed)).toBe(true);
			expect(isValidMimeType('application/pdf', allowed)).toBe(true);
			expect(isValidMimeType('video/mp4', allowed)).toBe(false);
		});
	});
});
