import { test, expect } from '@playwright/test';

const uploadDisabled = process.env.UPLOAD_ENABLED === 'false';
const authEnabled = process.env.AUTH_ENABLED === 'true';

test.describe('Homepage', () => {
	test.skip(uploadDisabled || authEnabled, 'Only runs when upload is enabled and auth is disabled');

	test('should load homepage', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveTitle(/PrivaSend/);

		const heading = page.locator('h1');
		await expect(heading).toHaveText('PrivaSend');

		const subtitle = page.locator('.subtitle');
		await expect(subtitle).toContainText('Secure File Sharing');

		const dropzone = page.locator('.dropzone');
		await expect(dropzone).toBeVisible();
	});

	test('should have file input', async ({ page }) => {
		await page.goto('/');

		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).toBeAttached();
	});

	test('should show upload zone with text', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('text=Drop your file here')).toBeVisible();
		await expect(page.locator('text=or click to browse')).toBeVisible();
		await expect(page.locator('text=Maximum file size: 5 GB')).toBeVisible();
	});
});
