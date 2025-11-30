import { describe, it, expect } from 'vitest';
import {
	sanitizeInput,
	sanitizeFilename,
	hasDangerousExtension,
	isValidMimeType,
	securityHeaders,
	httpsRedirect
} from '../../../src/lib/server/security';

describe('Security - Complete Coverage', () => {
	describe('sanitizeInput - all branches', () => {
		it('should handle strings with only < or >', () => {
			expect(sanitizeInput('<')).toBe('');
			expect(sanitizeInput('>')).toBe('');
			expect(sanitizeInput('<><><>')).toBe('');
		});

		it('should handle strings with javascript: multiple times', () => {
			expect(sanitizeInput('javascript:javascript:test')).toBe('test');
		});

		it('should handle mixed case javascript', () => {
			expect(sanitizeInput('JAVASCRIPT:test')).toBe('test');
			expect(sanitizeInput('JavaScript:test')).toBe('test');
		});

		it('should handle all event handlers', () => {
			const handlers = [
				'onclick=',
				'onload=',
				'onerror=',
				'onmouseover=',
				'onfocus=',
				'onblur=',
				'onchange=',
				'onsubmit='
			];

			handlers.forEach((handler) => {
				const result = sanitizeInput(handler + 'alert()');
				expect(result).not.toContain(handler);
			});
		});

		it('should trim leading and trailing whitespace', () => {
			expect(sanitizeInput('   test   ')).toBe('test');
			expect(sanitizeInput('\t\ntest\n\t')).toBe('test');
		});

		it('should handle combined sanitization', () => {
			const malicious = '  <script>javascript:onclick=alert(1)</script>  ';
			const result = sanitizeInput(malicious);
			expect(result.trim()).toBe('scriptalert(1)/script');
		});
	});

	describe('sanitizeFilename - complete coverage', () => {
		it('should remove all dots in path traversal', () => {
			expect(sanitizeFilename('..')).toBe('');
			expect(sanitizeFilename('....')).toBe('');
			expect(sanitizeFilename('a..b..c')).toBe('abc');
		});

		it('should replace all slashes', () => {
			expect(sanitizeFilename('a/b/c/d')).toBe('a_b_c_d');
			expect(sanitizeFilename('a\\b\\c\\d')).toBe('a_b_c_d');
			expect(sanitizeFilename('a/b\\c/d')).toBe('a_b_c_d');
		});

		it('should handle filenames with no extension', () => {
			expect(sanitizeFilename('README')).toBe('README');
		});

		it('should handle exactly 255 chars', () => {
			const name = 'a'.repeat(250) + '.txt';
			const result = sanitizeFilename(name);
			expect(result.length).toBe(254);
		});

		it('should handle filename > 255 with long extension', () => {
			const name = 'a'.repeat(260) + '.verylongextension';
			const result = sanitizeFilename(name);
			expect(result.length).toBeLessThanOrEqual(255);
		});

		it('should return unnamed_file for empty after sanitization', () => {
			expect(sanitizeFilename('..')).toBe('unnamed_file');
			expect(sanitizeFilename('/')).toBe('unnamed_file');
			expect(sanitizeFilename('\\')).toBe('unnamed_file');
		});
	});

	describe('hasDangerousExtension - all extensions', () => {
		it('should detect .exe', () => {
			expect(hasDangerousExtension('file.exe')).toBe(true);
		});

		it('should detect .bat', () => {
			expect(hasDangerousExtension('file.bat')).toBe(true);
		});

		it('should detect .cmd', () => {
			expect(hasDangerousExtension('file.cmd')).toBe(true);
		});

		it('should detect .com', () => {
			expect(hasDangerousExtension('file.com')).toBe(true);
		});

		it('should detect .pif', () => {
			expect(hasDangerousExtension('file.pif')).toBe(true);
		});

		it('should detect .scr', () => {
			expect(hasDangerousExtension('file.scr')).toBe(true);
		});

		it('should detect .vbs', () => {
			expect(hasDangerousExtension('file.vbs')).toBe(true);
		});

		it('should detect .js', () => {
			expect(hasDangerousExtension('file.js')).toBe(true);
		});

		it('should detect .jse', () => {
			expect(hasDangerousExtension('file.jse')).toBe(true);
		});

		it('should detect .wsf', () => {
			expect(hasDangerousExtension('file.wsf')).toBe(true);
		});

		it('should detect .wsh', () => {
			expect(hasDangerousExtension('file.wsh')).toBe(true);
		});

		it('should detect .ps1', () => {
			expect(hasDangerousExtension('file.ps1')).toBe(true);
		});

		it('should detect .psm1', () => {
			expect(hasDangerousExtension('file.psm1')).toBe(true);
		});

		it('should detect .sh', () => {
			expect(hasDangerousExtension('file.sh')).toBe(true);
		});

		it('should detect .bash', () => {
			expect(hasDangerousExtension('file.bash')).toBe(true);
		});

		it('should detect .csh', () => {
			expect(hasDangerousExtension('file.csh')).toBe(true);
		});

		it('should detect .jar', () => {
			expect(hasDangerousExtension('file.jar')).toBe(true);
		});

		it('should detect .app', () => {
			expect(hasDangerousExtension('file.app')).toBe(true);
		});

		it('should detect .deb', () => {
			expect(hasDangerousExtension('file.deb')).toBe(true);
		});

		it('should detect .rpm', () => {
			expect(hasDangerousExtension('file.rpm')).toBe(true);
		});

		it('should handle no extension', () => {
			expect(hasDangerousExtension('noextension')).toBe(false);
		});
	});

	describe('isValidMimeType - complete branches', () => {
		it('should allow all when empty array', () => {
			expect(isValidMimeType('anything/goes', [])).toBe(true);
			expect(isValidMimeType('random/type', [])).toBe(true);
		});

		it('should match exact type', () => {
			expect(isValidMimeType('image/jpeg', ['image/jpeg'])).toBe(true);
		});

		it('should not match different exact type', () => {
			expect(isValidMimeType('image/png', ['image/jpeg'])).toBe(false);
		});

		it('should match wildcard', () => {
			expect(isValidMimeType('image/jpeg', ['image/*'])).toBe(true);
			expect(isValidMimeType('image/png', ['image/*'])).toBe(true);
		});

		it('should not match different category wildcard', () => {
			expect(isValidMimeType('video/mp4', ['image/*'])).toBe(false);
		});

		it('should handle MIME without category', () => {
			expect(isValidMimeType('nocategory', ['image/*'])).toBe(false);
		});

		it('should handle multiple allowed types', () => {
			const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
			expect(isValidMimeType('image/jpeg', allowed)).toBe(true);
			expect(isValidMimeType('image/png', allowed)).toBe(true);
			expect(isValidMimeType('application/pdf', allowed)).toBe(true);
			expect(isValidMimeType('video/mp4', allowed)).toBe(false);
		});
	});

	describe('Middleware functions', () => {
		describe('securityHeaders', () => {
			it('should be a function', () => {
				expect(typeof securityHeaders).toBe('function');
			});
		});

		describe('httpsRedirect', () => {
			it('should be a function', () => {
				expect(typeof httpsRedirect).toBe('function');
			});
		});
	});
});
