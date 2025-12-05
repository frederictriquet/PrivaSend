import { describe, it, expect } from 'vitest';
import { config } from '$lib/server/config';

/**
 * Real config tests that import the source
 */

describe('Config - Real Import Tests', () => {
	it('should have storage configuration', () => {
		expect(config.storage).toBeDefined();
		expect(config.storage.path).toBeDefined();
	});

	it('should have database configuration', () => {
		expect(config.database).toBeDefined();
		expect(config.database.path).toBeDefined();
	});

	it('should have upload configuration', () => {
		expect(config.upload).toBeDefined();
		expect(typeof config.upload.enabled).toBe('boolean');
	});

	it('should have auth configuration', () => {
		expect(config.auth).toBeDefined();
		expect(typeof config.auth.enabled).toBe('boolean');
	});

	it('should have retention settings', () => {
		expect(config.retention).toBeDefined();
		expect(typeof config.retention.defaultExpirationDays).toBe('number');
	});

	it('should have shared volume config', () => {
		expect(config.sharedVolume).toBeDefined();
		expect(typeof config.sharedVolume.enabled).toBe('boolean');
	});
});
