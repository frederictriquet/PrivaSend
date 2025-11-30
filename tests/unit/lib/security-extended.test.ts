import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../../../src/lib/server/security';

describe('Security Extended Tests', () => {
	describe('sanitizeInput', () => {
		it('should remove HTML tags', () => {
			expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
		});

		it('should remove angle brackets', () => {
			expect(sanitizeInput('test<>test')).toBe('testtest');
		});

		it('should remove javascript protocol', () => {
			expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
		});

		it('should be case insensitive for javascript', () => {
			expect(sanitizeInput('JaVaScRiPt:alert(1)')).toBe('alert(1)');
		});

		it('should remove event handlers', () => {
			expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
			expect(sanitizeInput('onload=bad()')).toBe('bad()');
			expect(sanitizeInput('onerror=hack()')).toBe('hack()');
		});

		it('should trim whitespace', () => {
			expect(sanitizeInput('  test  ')).toBe('test');
		});

		it('should handle normal text', () => {
			expect(sanitizeInput('Hello World')).toBe('Hello World');
		});

		it('should handle empty string', () => {
			expect(sanitizeInput('')).toBe('');
		});

		it('should handle multiple threats at once', () => {
			const malicious = '<script>javascript:onclick=alert("xss")</script>';
			const result = sanitizeInput(malicious);
			expect(result).not.toContain('<');
			expect(result).not.toContain('>');
			expect(result).not.toContain('javascript:');
			expect(result).not.toContain('onclick=');
		});
	});

	describe('filename edge cases', () => {
		it('should handle very long filenames', () => {
			const { sanitizeFilename } = require('../../../src/lib/server/security');
			const longName = 'a'.repeat(300) + '.txt';
			const result = sanitizeFilename(longName);
			expect(result.length).toBeLessThanOrEqual(255);
			expect(result).toContain('.txt');
		});

		it('should handle multiple dots', () => {
			const { sanitizeFilename } = require('../../../src/lib/server/security');
			expect(sanitizeFilename('file.tar.gz')).toBe('file.tar.gz');
		});

		it('should handle unicode characters', () => {
			const { sanitizeFilename } = require('../../../src/lib/server/security');
			expect(sanitizeFilename('文件.pdf')).toBe('文件.pdf');
		});

		it('should handle spaces', () => {
			const { sanitizeFilename } = require('../../../src/lib/server/security');
			expect(sanitizeFilename('my file.txt')).toBe('my file.txt');
		});
	});

	describe('dangerous extensions edge cases', () => {
		it('should detect uppercase extensions', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			expect(hasDangerousExtension('FILE.EXE')).toBe(true);
		});

		it('should detect mixed case', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			expect(hasDangerousExtension('script.Sh')).toBe(true);
		});

		it('should handle multiple extensions', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			expect(hasDangerousExtension('file.tar.sh')).toBe(true);
		});

		it('should allow safe image formats', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			expect(hasDangerousExtension('photo.png')).toBe(false);
			expect(hasDangerousExtension('image.gif')).toBe(false);
			expect(hasDangerousExtension('pic.webp')).toBe(false);
		});

		it('should allow safe document formats', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			expect(hasDangerousExtension('document.docx')).toBe(false);
			expect(hasDangerousExtension('sheet.xlsx')).toBe(false);
			expect(hasDangerousExtension('presentation.pptx')).toBe(false);
		});

		it('should allow safe archive formats', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			expect(hasDangerousExtension('archive.7z')).toBe(false);
			expect(hasDangerousExtension('files.rar')).toBe(false);
		});

		it('should detect all dangerous script extensions', () => {
			const { hasDangerousExtension } = require('../../../src/lib/server/security');
			const dangerous = [
				'malware.exe',
				'script.bat',
				'cmd.cmd',
				'virus.com',
				'bad.pif',
				'screen.scr',
				'evil.vbs',
				'hack.js',
				'bad.jse',
				'script.wsf',
				'shell.sh',
				'powershell.ps1'
			];

			dangerous.forEach((filename) => {
				expect(hasDangerousExtension(filename)).toBe(true);
			});
		});
	});

	describe('MIME type validation edge cases', () => {
		it('should handle multiple wildcards', () => {
			const { isValidMimeType } = require('../../../src/lib/server/security');
			const allowed = ['image/*', 'video/*', 'audio/*'];

			expect(isValidMimeType('image/jpeg', allowed)).toBe(true);
			expect(isValidMimeType('video/mp4', allowed)).toBe(true);
			expect(isValidMimeType('audio/mpeg', allowed)).toBe(true);
			expect(isValidMimeType('application/pdf', allowed)).toBe(false);
		});

		it('should handle mixed exact and wildcard', () => {
			const { isValidMimeType } = require('../../../src/lib/server/security');
			const allowed = ['image/*', 'application/pdf', 'text/plain'];

			expect(isValidMimeType('image/png', allowed)).toBe(true);
			expect(isValidMimeType('application/pdf', allowed)).toBe(true);
			expect(isValidMimeType('text/plain', allowed)).toBe(true);
			expect(isValidMimeType('application/json', allowed)).toBe(false);
		});

		it('should handle empty MIME type', () => {
			const { isValidMimeType } = require('../../../src/lib/server/security');
			expect(isValidMimeType('', [])).toBe(true);
			expect(isValidMimeType('', ['image/*'])).toBe(false);
		});

		it('should handle invalid MIME format', () => {
			const { isValidMimeType } = require('../../../src/lib/server/security');
			expect(isValidMimeType('invalid', ['image/*'])).toBe(false);
		});

		it('should be case sensitive', () => {
			const { isValidMimeType } = require('../../../src/lib/server/security');
			const allowed = ['image/jpeg'];
			expect(isValidMimeType('image/JPEG', allowed)).toBe(false);
			expect(isValidMimeType('IMAGE/jpeg', allowed)).toBe(false);
		});
	});
});
