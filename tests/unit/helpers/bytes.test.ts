import { describe, it, expect } from 'vitest';

describe('Byte Calculations', () => {
	describe('formatBytes helper', () => {
		function formatBytes(bytes: number): string {
			if (bytes === 0) return '0 Bytes';
			const k = 1024;
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
		}

		it('should handle all size units', () => {
			expect(formatBytes(0)).toBe('0 Bytes');
			expect(formatBytes(1)).toBe('1 Bytes');
			expect(formatBytes(1023)).toBe('1023 Bytes');
			expect(formatBytes(1024)).toBe('1 KB');
			expect(formatBytes(1048576)).toBe('1 MB');
			expect(formatBytes(1073741824)).toBe('1 GB');
			expect(formatBytes(1099511627776)).toBe('1 TB');
		});

		it('should round correctly', () => {
			expect(formatBytes(1536)).toBe('1.5 KB');
			expect(formatBytes(1234567)).toBe('1.18 MB');
			expect(formatBytes(1234567890)).toBe('1.15 GB');
		});

		it('should handle edge values', () => {
			expect(formatBytes(1023)).toBe('1023 Bytes');
			expect(formatBytes(1025)).toBe('1 KB');
			expect(formatBytes(1048575)).toBe('1024 KB');
			expect(formatBytes(1048577)).toBe('1 MB');
		});
	});

	describe('size constants', () => {
		it('should define correct constants', () => {
			const KB = 1024;
			const MB = KB * 1024;
			const GB = MB * 1024;
			const TB = GB * 1024;

			expect(KB).toBe(1024);
			expect(MB).toBe(1048576);
			expect(GB).toBe(1073741824);
			expect(TB).toBe(1099511627776);
		});

		it('should calculate 5GB correctly', () => {
			const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
			expect(MAX_FILE_SIZE).toBe(5368709120);
		});

		it('should calculate 5MB chunks correctly', () => {
			const CHUNK_SIZE = 5 * 1024 * 1024;
			expect(CHUNK_SIZE).toBe(5242880);
		});
	});
});
