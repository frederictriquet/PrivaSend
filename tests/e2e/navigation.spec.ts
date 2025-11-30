import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('should have correct page title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/PrivaSend/);
	});

	test('should display header', async ({ page }) => {
		await page.goto('/');
		const header = page.locator('header');
		await expect(header).toBeVisible();
	});

	test('should have footer', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('footer');
		await expect(footer).toBeVisible();
	});

	test('should show upload interface elements', async ({ page }) => {
		await page.goto('/');

		// Check for key UI elements
		await expect(page.locator('.upload-section')).toBeVisible();
		await expect(page.locator('.dropzone')).toBeVisible();
	});

	test('should have accessible file input', async ({ page }) => {
		await page.goto('/');

		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).toBeAttached();
		await expect(fileInput).toHaveAttribute('aria-label');
	});
});

test.describe('Responsive Design', () => {
	test('should be mobile friendly', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
		await page.goto('/');

		const container = page.locator('.container');
		await expect(container).toBeVisible();
	});

	test('should be tablet friendly', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
		await page.goto('/');

		const container = page.locator('.container');
		await expect(container).toBeVisible();
	});

	test('should be desktop friendly', async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
		await page.goto('/');

		const container = page.locator('.container');
		await expect(container).toBeVisible();
	});
});

test.describe('UI States', () => {
	test('should show upload zone initially', async ({ page }) => {
		await page.goto('/');

		const dropzone = page.locator('.dropzone');
		await expect(dropzone).toBeVisible();
		await expect(dropzone).toContainText('Drop your file here');
	});

	test('should have clickable dropzone', async ({ page }) => {
		await page.goto('/');

		const dropzone = page.locator('.dropzone');
		await expect(dropzone).toHaveAttribute('role', 'button');
		await expect(dropzone).toHaveAttribute('tabindex', '0');
	});
});
