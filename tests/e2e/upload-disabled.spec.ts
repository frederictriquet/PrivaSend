import { test, expect } from '@playwright/test';

const uploadDisabled = process.env.UPLOAD_ENABLED === 'false';
const authEnabled = process.env.AUTH_ENABLED === 'true';

test.describe('Upload Disabled Mode', () => {
	test.skip(!uploadDisabled, 'Requires UPLOAD_ENABLED=false');

	test('should show "Upload Disabled" notice when upload disabled without shared volume', async ({
		page
	}) => {
		await page.goto('/');

		await expect(page.locator('text=Upload Disabled')).toBeVisible();
	});

	test('should not show upload UI when disabled', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('.dropzone')).not.toBeVisible();
		await expect(page.locator('input[type="file"]')).not.toBeVisible();
	});
});

test.describe('Upload API - Disabled Mode', () => {
	test.skip(!uploadDisabled, 'Requires UPLOAD_ENABLED=false');

	test('should reject API upload requests with 403', async ({ request }) => {
		const formData = new FormData();
		formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

		const response = await request.post('/api/upload', {
			data: formData
		});

		expect(response.status()).toBe(403);

		const json = await response.json();
		expect(json.message).toContain('disabled');
	});

	test('should reject chunked upload requests when disabled', async ({ request }) => {
		const chunk = new Uint8Array(1024);

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

		expect(response.status()).toBe(403);

		const json = await response.json();
		expect(json.message).toContain('disabled');
	});

	test('should not process any upload data when disabled', async ({ request }) => {
		const largeData = new Uint8Array(1024 * 1024);

		const response = await request.post('/api/upload', {
			headers: {
				'Content-Type': 'application/octet-stream',
				'X-File-Id': 'large-file',
				'X-Chunk-Index': '0',
				'X-Total-Chunks': '1000',
				'X-File-Name': 'large.bin',
				'X-Mime-Type': 'application/octet-stream'
			},
			data: largeData
		});

		expect(response.status()).toBe(403);
	});

	test('should reject before rate limiting when disabled', async ({ request }) => {
		const formData = new FormData();
		formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

		const response = await request.post('/api/upload', {
			data: formData
		});

		expect(response.status()).toBe(403);
		expect(response.status()).not.toBe(429);
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

	test('should indicate correct upload status', async ({ request }) => {
		const response = await request.get('/api/config');
		const json = await response.json();

		expect(json.upload.enabled).toBe(!uploadDisabled);
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
	test.skip(uploadDisabled || authEnabled, 'Only runs when upload is enabled and auth is disabled');

	test('should show upload UI when enabled', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('.dropzone')).toBeVisible();
		await expect(page.locator('text=Drop your file here')).toBeVisible();
	});

	test('should have functional file input when enabled', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('input[type="file"]')).toBeAttached();
	});

	test('should not redirect when upload is enabled', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL(/\/$/);
	});
});

test.describe('Documentation - Upload Disabled Instructions', () => {
	test('config API should provide clear status', async ({ request }) => {
		const response = await request.get('/api/config');
		const json = await response.json();

		expect(json.upload.enabled).toBeDefined();
		expect(typeof json.upload.enabled).toBe('boolean');
	});
});
