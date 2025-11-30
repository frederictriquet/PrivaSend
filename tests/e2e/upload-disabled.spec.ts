import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Upload Disabled Mode (Phase 1.6)
 *
 * These tests verify the behavior when UPLOAD_ENABLED=false
 * Note: To run these tests with upload disabled, set UPLOAD_ENABLED=false in your environment
 * The tests assume upload is ENABLED by default (standard configuration)
 */

test.describe('Upload Disabled Mode', () => {
	// Skip these tests by default since they require UPLOAD_ENABLED=false
	// To run: UPLOAD_ENABLED=false npm run test:e2e
	test.skip('should redirect to /share-existing when upload disabled and shared volume enabled', async ({
		page
	}) => {
		// When UPLOAD_ENABLED=false and SHARED_VOLUME_ENABLED=true
		// The server should redirect from / to /share-existing
		await page.goto('/');

		// Should be redirected to /share-existing
		await expect(page).toHaveURL(/\/share-existing/);
	});

	test.skip('should show "Upload Disabled" notice when upload disabled without shared volume', async ({
		page
	}) => {
		// When UPLOAD_ENABLED=false and SHARED_VOLUME_ENABLED=false
		// Should show a disabled notice
		await page.goto('/');

		// Check for disabled notice
		await expect(page.locator('text=Upload Disabled')).toBeVisible();
	});

	test.skip('should not show upload UI when disabled', async ({ page }) => {
		await page.goto('/');

		// Upload UI elements should not be visible
		const dropzone = page.locator('.dropzone');
		await expect(dropzone).not.toBeVisible();

		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).not.toBeVisible();
	});
});

test.describe('Upload API - Disabled Mode', () => {
	test.skip('should reject API upload requests with 403', async ({ request }) => {
		// Attempt to upload via API when disabled
		const formData = new FormData();
		formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

		const response = await request.post('/api/upload', {
			data: formData
		});

		// Should return 403 Forbidden
		expect(response.status()).toBe(403);

		const json = await response.json();
		expect(json.message).toContain('disabled');
	});

	test.skip('should reject chunked upload requests when disabled', async ({ request }) => {
		// Attempt chunked upload
		const chunk = new Uint8Array(1024); // 1KB chunk

		const response = await request.post('/api/upload', {
			headers: {
				'Content-Type': 'application/octet-stream',
				'X-File-Id': 'test-file-id',
				'X-Chunk-Index': '0',
				'X-Total-Chunks': '1',
				'X-File-Name': 'test.txt',
				'X-Mime-Type': 'text/plain'
			},
			data: chunk
		});

		// Should return 403 Forbidden
		expect(response.status()).toBe(403);

		const json = await response.json();
		expect(json.message).toContain('disabled');
	});
});

test.describe('Config API', () => {
	test('should return upload configuration', async ({ request }) => {
		const response = await request.get('/api/config');

		expect(response.status()).toBe(200);

		const json = await response.json();
		expect(json).toHaveProperty('upload');
		expect(json.upload).toHaveProperty('enabled');
		expect(typeof json.upload.enabled).toBe('boolean');
	});

	test('should indicate upload is enabled by default', async ({ request }) => {
		// By default (in standard test environment), upload should be enabled
		const response = await request.get('/api/config');
		const json = await response.json();

		// Default configuration
		expect(json.upload.enabled).toBe(true);
	});

	test('should return shared volume configuration', async ({ request }) => {
		const response = await request.get('/api/config');
		const json = await response.json();

		expect(json).toHaveProperty('sharedVolume');
		expect(json.sharedVolume).toHaveProperty('enabled');
		expect(typeof json.sharedVolume.enabled).toBe('boolean');
	});
});

test.describe('Upload Enabled Mode (Default)', () => {
	test('should show upload UI when enabled', async ({ page }) => {
		await page.goto('/');

		// Upload UI should be visible
		const dropzone = page.locator('.dropzone');
		await expect(dropzone).toBeVisible();

		// Check upload instructions
		await expect(page.locator('text=Drop your file here')).toBeVisible();
	});

	test('should have functional file input when enabled', async ({ page }) => {
		await page.goto('/');

		// File input should exist and be functional
		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).toBeAttached();
	});

	test('should not redirect when upload is enabled', async ({ page }) => {
		await page.goto('/');

		// Should stay on homepage
		await expect(page).toHaveURL(/\/$/);
	});
});

test.describe('Server-Side Redirect Logic', () => {
	test.skip('should only redirect when upload disabled AND shared volume enabled', async ({
		page
	}) => {
		// The redirect logic in +page.server.ts:
		// if (!config.upload.enabled && config.sharedVolume.enabled)
		// This means BOTH conditions must be true for redirect

		await page.goto('/');

		// In standard config (upload=true, shared=false), no redirect
		await expect(page).toHaveURL(/\/$/);
	});
});

test.describe('Security - Upload Disabled', () => {
	test.skip('should not process any upload data when disabled', async ({ request }) => {
		// Even with a large file attempt, should immediately return 403
		// without consuming resources
		const largeData = new Uint8Array(1024 * 1024); // 1MB

		const response = await request.post('/api/upload', {
			headers: {
				'Content-Type': 'application/octet-stream',
				'X-File-Id': 'large-file',
				'X-Chunk-Index': '0',
				'X-Total-Chunks': '1000', // Pretend large file
				'X-File-Name': 'large.bin',
				'X-Mime-Type': 'application/octet-stream'
			},
			data: largeData
		});

		// Should immediately reject without processing
		expect(response.status()).toBe(403);
	});

	test.skip('should reject before rate limiting when disabled', async ({ request }) => {
		// The upload disable check happens BEFORE rate limiting
		// So even if rate limit would allow, upload is still rejected
		const formData = new FormData();
		formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

		const response = await request.post('/api/upload', {
			data: formData
		});

		// 403 (disabled) should come before 429 (rate limit)
		expect(response.status()).toBe(403);
		expect(response.status()).not.toBe(429);
	});
});

test.describe('Documentation - Upload Disabled Instructions', () => {
	test('config API should provide clear status', async ({ request }) => {
		// The /api/config endpoint should make it clear if upload is disabled
		const response = await request.get('/api/config');
		const json = await response.json();

		// Clear boolean value
		expect(json.upload.enabled).toBeDefined();
		expect(typeof json.upload.enabled).toBe('boolean');
	});
});
