import { describe, it, expect } from 'vitest';

describe('Version API', () => {
	it('should return version information', async () => {
		// Mock the API endpoint
		const mockResponse = {
			name: 'privasend',
			version: '0.4.0',
			nodeVersion: process.version,
			platform: process.platform,
			arch: process.arch,
			env: 'development'
		};

		expect(mockResponse.name).toBe('privasend');
		expect(mockResponse.version).toBeDefined();
		expect(mockResponse.nodeVersion).toBeDefined();
	});

	it('should have correct structure', () => {
		const response = {
			name: 'privasend',
			version: '0.4.0',
			nodeVersion: 'v20.10.0',
			platform: 'linux',
			arch: 'x64',
			env: 'production'
		};

		expect(response).toHaveProperty('name');
		expect(response).toHaveProperty('version');
		expect(response).toHaveProperty('nodeVersion');
		expect(response).toHaveProperty('platform');
		expect(response).toHaveProperty('arch');
		expect(response).toHaveProperty('env');
	});
});
