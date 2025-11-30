import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
	describe('formatBytes', () => {
		function formatBytes(bytes: number): string {
			if (bytes === 0) return '0 Bytes';
			const k = 1024;
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
		}

		it('should format zero bytes', () => {
			expect(formatBytes(0)).toBe('0 Bytes');
		});

		it('should format bytes', () => {
			expect(formatBytes(500)).toBe('500 Bytes');
		});

		it('should format kilobytes', () => {
			expect(formatBytes(1024)).toBe('1 KB');
			expect(formatBytes(1536)).toBe('1.5 KB');
		});

		it('should format megabytes', () => {
			expect(formatBytes(1048576)).toBe('1 MB');
			expect(formatBytes(5242880)).toBe('5 MB');
		});

		it('should format gigabytes', () => {
			expect(formatBytes(1073741824)).toBe('1 GB');
			expect(formatBytes(5368709120)).toBe('5 GB');
		});

		it('should round to 2 decimals', () => {
			expect(formatBytes(1234567)).toBe('1.18 MB');
		});
	});

	describe('date calculations', () => {
		it('should calculate expiration date', () => {
			const days = 7;
			const now = new Date();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + days);

			const diff = expiresAt.getTime() - now.getTime();
			const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

			expect(daysDiff).toBeGreaterThanOrEqual(6);
			expect(daysDiff).toBeLessThanOrEqual(7);
		});

		it('should detect expired dates', () => {
			const now = new Date();
			const expired = new Date(now.getTime() - 1000);
			expect(expired < now).toBe(true);
		});

		it('should detect future dates', () => {
			const now = new Date();
			const future = new Date(now.getTime() + 1000);
			expect(future > now).toBe(true);
		});
	});

	describe('token generation', () => {
		it('should generate unique tokens', () => {
			const { nanoid } = require('nanoid');
			const token1 = nanoid(32);
			const token2 = nanoid(32);

			expect(token1).not.toBe(token2);
			expect(token1.length).toBe(32);
			expect(token2.length).toBe(32);
		});

		it('should generate URL-safe tokens', () => {
			const { nanoid } = require('nanoid');
			const token = nanoid(32);

			// Should only contain URL-safe characters
			expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
		});
	});

	describe('chunk calculations', () => {
		it('should calculate correct number of chunks', () => {
			const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

			const fileSize1 = 10 * 1024 * 1024; // 10MB
			const chunks1 = Math.ceil(fileSize1 / CHUNK_SIZE);
			expect(chunks1).toBe(2);

			const fileSize2 = 15 * 1024 * 1024; // 15MB
			const chunks2 = Math.ceil(fileSize2 / CHUNK_SIZE);
			expect(chunks2).toBe(3);

			const fileSize3 = 5 * 1024 * 1024; // Exactly 5MB
			const chunks3 = Math.ceil(fileSize3 / CHUNK_SIZE);
			expect(chunks3).toBe(1);
		});

		it('should handle file smaller than chunk size', () => {
			const CHUNK_SIZE = 5 * 1024 * 1024;
			const fileSize = 1024 * 1024; // 1MB

			const chunks = Math.ceil(fileSize / CHUNK_SIZE);
			expect(chunks).toBe(1);
		});

		it('should calculate last chunk size', () => {
			const CHUNK_SIZE = 5 * 1024 * 1024;
			const fileSize = 12 * 1024 * 1024; // 12MB

			const totalChunks = Math.ceil(fileSize / CHUNK_SIZE); // 3 chunks
			const lastChunkSize = fileSize - (totalChunks - 1) * CHUNK_SIZE;

			expect(lastChunkSize).toBe(2 * 1024 * 1024); // 2MB
		});
	});

	describe('progress calculations', () => {
		it('should calculate upload progress', () => {
			const totalChunks = 10;
			const uploadedChunks = 5;
			const progress = Math.round((uploadedChunks / totalChunks) * 100);

			expect(progress).toBe(50);
		});

		it('should handle 0% progress', () => {
			const progress = Math.round((0 / 10) * 100);
			expect(progress).toBe(0);
		});

		it('should handle 100% progress', () => {
			const progress = Math.round((10 / 10) * 100);
			expect(progress).toBe(100);
		});

		it('should round progress correctly', () => {
			const progress = Math.round((7 / 10) * 100);
			expect(progress).toBe(70);
		});
	});
});
