import { describe, it, expect } from 'vitest';
import { theme } from '$lib/stores/theme';

/**
 * Real theme store tests that import the source
 */

describe('Theme Store - Real Tests', () => {
	it('should have subscribe method', () => {
		expect(typeof theme.subscribe).toBe('function');
	});

	it('should have toggle method', () => {
		expect(typeof theme.toggle).toBe('function');
	});

	it('should have set method', () => {
		expect(typeof theme.set).toBe('function');
	});
});
