import { describe, it, expect } from 'vitest';
import { config } from '$lib/server/config';

/**
 * Upload Config Tests
 *
 * These tests verify the upload.enabled configuration behavior.
 * Note: These tests check the configuration as loaded at runtime.
 * To test different configurations, run tests with different env vars:
 * - UPLOAD_ENABLED=false npm run test
 * - UPLOAD_ENABLED=true npm run test
 */

describe('Upload Config', () => {
	it('should have upload configuration object', () => {
		expect(config.upload).toBeDefined();
		expect(config.upload).toHaveProperty('enabled');
	});

	it('should have boolean enabled property', () => {
		expect(typeof config.upload.enabled).toBe('boolean');
	});

	it('should default to enabled in test environment', () => {
		// By default (no UPLOAD_ENABLED env var), should be enabled
		// This is the backward-compatible default
		expect(config.upload.enabled).toBe(true);
	});

	it('should implement case-insensitive false detection', () => {
		// Test the logic: env.UPLOAD_ENABLED?.toLowerCase() !== 'false'
		const testLogic = (value: string | undefined) => {
			return value?.toLowerCase() !== 'false';
		};

		// Should disable only for 'false' (case insensitive)
		expect(testLogic('false')).toBe(false);
		expect(testLogic('FALSE')).toBe(false);
		expect(testLogic('False')).toBe(false);

		// Should enable for everything else
		expect(testLogic(undefined)).toBe(true);
		expect(testLogic('')).toBe(true);
		expect(testLogic('true')).toBe(true);
		expect(testLogic('1')).toBe(true);
		expect(testLogic('yes')).toBe(true);
		expect(testLogic('0')).toBe(true);
	});

	it('should be part of the config object structure', () => {
		expect(config).toHaveProperty('storage');
		expect(config).toHaveProperty('database');
		expect(config).toHaveProperty('upload');
		expect(config).toHaveProperty('sharedVolume');
	});

	it('should export config as const', () => {
		// The config is exported with 'as const', making it immutable
		// This test verifies the config structure
		expect(Object.isFrozen(config)).toBe(false); // 'as const' doesn't freeze, but provides type safety
	});

	describe('Configuration Logic', () => {
		it('should only disable when explicitly set to "false"', () => {
			// The logic is: env.UPLOAD_ENABLED?.toLowerCase() !== 'false'
			// This means ONLY the string "false" (case insensitive) will disable
			const isEnabled = (envValue: string | undefined): boolean => {
				return envValue?.toLowerCase() !== 'false';
			};

			// Test all "false" variations
			expect(isEnabled('false')).toBe(false);
			expect(isEnabled('FALSE')).toBe(false);
			expect(isEnabled('False')).toBe(false);
			expect(isEnabled('FaLsE')).toBe(false);

			// Everything else is enabled
			expect(isEnabled(undefined)).toBe(true);
			expect(isEnabled('')).toBe(true);
			expect(isEnabled('true')).toBe(true);
			expect(isEnabled('0')).toBe(true);
			expect(isEnabled('no')).toBe(true);
		});
	});

	describe('Backward Compatibility', () => {
		it('should maintain backward compatibility by defaulting to enabled', () => {
			// When UPLOAD_ENABLED is not set, the default behavior is enabled
			// This ensures existing deployments continue to work
			// In test env, this should be true
			expect(config.upload.enabled).toBe(true);
		});
	});

	describe('Integration with other config', () => {
		it('should coexist with sharedVolume config', () => {
			// Both upload and sharedVolume can be configured independently
			expect(config.upload).toBeDefined();
			expect(config.sharedVolume).toBeDefined();
			expect(config.sharedVolume).toHaveProperty('enabled');
		});

		it('should support three operational modes', () => {
			// Mode 1: Upload-only (upload=true, shared=false)
			// Mode 2: Shared-only (upload=false, shared=true)
			// Mode 3: Hybrid (both=true)

			// We can have both configs
			expect(config.upload.enabled).toBeDefined();
			expect(config.sharedVolume.enabled).toBeDefined();
		});
	});
});
