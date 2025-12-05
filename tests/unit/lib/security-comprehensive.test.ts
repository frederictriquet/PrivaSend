import { describe, it, expect } from 'vitest';
import { sanitizeFilename, isValidMimeType, hasDangerousExtension } from '$lib/server/security';

describe('Security - Mutation Testing Improvements', () => {
	describe('sanitizeFilename - All Edge Cases', () => {
		it('should preserve safe filenames', () => {
			expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
		});

		it('should remove path traversal attempts', () => {
			const result = sanitizeFilename('../../../etc/passwd');
			expect(result).not.toContain('..');
		});

		it('should handle nested path traversal', () => {
			const result = sanitizeFilename('../../.../../evil');
			expect(result).not.toContain('..');
		});

		it('should remove forward slashes', () => {
			const result = sanitizeFilename('path/to/file.txt');
			expect(result).not.toContain('/');
		});

		it('should remove backslashes', () => {
			const result = sanitizeFilename('C:\\Windows\\file.exe');
			expect(result).not.toContain('\\');
		});

		it('should handle multiple dangerous chars', () => {
			const result = sanitizeFilename('../path\\to/../../file');
			expect(result).not.toContain('..');
			expect(result).not.toContain('/');
			expect(result).not.toContain('\\');
		});
	});

	describe('isValidMimeType - Boundary Tests', () => {
		it('should return true for empty allowed list', () => {
			expect(isValidMimeType('anything', [])).toBe(true);
		});

		it('should validate exact mime match', () => {
			expect(isValidMimeType('image/png', ['image/png', 'image/jpeg'])).toBe(true);
		});

		it('should reject when not in list', () => {
			expect(isValidMimeType('application/pdf', ['image/png'])).toBe(false);
		});

		it('should handle single item list', () => {
			expect(isValidMimeType('text/plain', ['text/plain'])).toBe(true);
		});
	});

	describe('hasDangerousExtension - Known Dangerous', () => {
		// Test actual dangerous extensions from the code
		const actualDangerous = [
			'file.exe',
			'script.bat',
			'run.cmd',
			'app.com',
			'virus.scr',
			'evil.vbs',
			'hack.jar',
			'app.app'
		];

		actualDangerous.forEach((filename) => {
			it(`should block ${filename}`, () => {
				expect(hasDangerousExtension(filename)).toBe(true);
			});
		});

		it('should handle uppercase EXE', () => {
			expect(hasDangerousExtension('FILE.EXE')).toBe(true);
		});

		it('should handle mixed case ExE', () => {
			expect(hasDangerousExtension('file.ExE')).toBe(true);
		});

		it('should allow safe extensions', () => {
			expect(hasDangerousExtension('document.pdf')).toBe(false);
			expect(hasDangerousExtension('image.png')).toBe(false);
			expect(hasDangerousExtension('data.json')).toBe(false);
		});

		it('should handle files without extension', () => {
			expect(hasDangerousExtension('README')).toBe(false);
		});

		it('should check last extension in compound names', () => {
			expect(hasDangerousExtension('archive.tar.exe')).toBe(true);
		});
	});
});
