import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
	test('should load homepage', async ({ page }) => {
		await page.goto('/');

		// Check title
		await expect(page).toHaveTitle(/PrivaSend/);

		// Check main heading
		const heading = page.locator('h1');
		await expect(heading).toHaveText('PrivaSend');

		// Check subtitle
		const subtitle = page.locator('.subtitle');
		await expect(subtitle).toContainText('Secure File Sharing');

		// Check dropzone is visible
		const dropzone = page.locator('.dropzone');
		await expect(dropzone).toBeVisible();
	});

	test('should have file input', async ({ page }) => {
		await page.goto('/');

		// File input should exist (hidden)
		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).toBeAttached();
	});

	test('should show upload zone with text', async ({ page }) => {
		await page.goto('/');

		// Check upload instructions
		await expect(page.locator('text=Drop your file here')).toBeVisible();
		await expect(page.locator('text=or click to browse')).toBeVisible();
		await expect(page.locator('text=Maximum file size: 5 GB')).toBeVisible();
	});
});
