import { describe, it, expect } from 'vitest';
import { config } from '../../../src/lib/server/config';

describe('Config', () => {
	describe('storage', () => {
		it('should have storage configuration', () => {
			expect(config.storage).toBeDefined();
			expect(config.storage.path).toBeDefined();
		});

		it('should have valid maxFileSize', () => {
			expect(config.storage.maxFileSize).toBeGreaterThan(0);
			expect(typeof config.storage.maxFileSize).toBe('number');
		});

		it('should have valid chunkSize', () => {
			expect(config.storage.chunkSize).toBeGreaterThan(0);
			expect(typeof config.storage.chunkSize).toBe('number');
		});

		it('should have allowedMimeTypes array', () => {
			expect(Array.isArray(config.storage.allowedMimeTypes)).toBe(true);
		});
	});

	describe('database', () => {
		it('should have database configuration', () => {
			expect(config.database).toBeDefined();
			expect(config.database.path).toBeDefined();
		});
	});

	describe('retention', () => {
		it('should have retention configuration', () => {
			expect(config.retention).toBeDefined();
		});

		it('should have valid defaultExpirationDays', () => {
			expect(config.retention.defaultExpirationDays).toBeGreaterThan(0);
		});

		it('should have valid cleanupIntervalHours', () => {
			expect(config.retention.cleanupIntervalHours).toBeGreaterThan(0);
		});
	});

	describe('links', () => {
		it('should have links configuration', () => {
			expect(config.links).toBeDefined();
		});

		it('should have valid defaultExpirationDays', () => {
			expect(config.links.defaultExpirationDays).toBeGreaterThan(0);
		});

		it('should have valid tokenLength', () => {
			expect(config.links.tokenLength).toBeGreaterThan(0);
			expect(config.links.tokenLength).toBe(32);
		});
	});
});
