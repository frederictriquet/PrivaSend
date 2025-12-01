import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication (Phase 1.7)
 * These tests are skipped by default as they require AUTH_ENABLED=true
 * To run: AUTH_ENABLED=true ADMIN_PASSWORD=testpass npm run test:e2e
 */

test.describe('Authentication Flow', () => {
	test.skip('should show login page', async ({ page }) => {
		await page.goto('/login');

		await expect(page).toHaveTitle(/Admin Login/);
		await expect(page.locator('h2')).toContainText('Admin Login');
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test.skip('should redirect to login when accessing / without auth', async ({ page }) => {
		// When AUTH_ENABLED=true and no session, should redirect to /login
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});

	test.skip('should redirect to login when accessing /share-existing without auth', async ({
		page
	}) => {
		await page.goto('/share-existing');
		await expect(page).toHaveURL(/\/login/);
	});

	test.skip('should show error with wrong password', async ({ page }) => {
		await page.goto('/login');

		await page.fill('input[type="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		await expect(page.locator('.error')).toBeVisible();
		await expect(page.locator('.error')).toContainText('Invalid password');
	});

	test.skip('should login successfully with correct password', async ({ page }) => {
		await page.goto('/login');

		// Use the configured ADMIN_PASSWORD
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');

		// Should redirect to / after successful login
		await expect(page).toHaveURL(/\/$/);
	});

	test.skip('should show logout button when authenticated', async ({ page }) => {
		// After login, logout button should be visible
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');

		await expect(page.locator('.logout-button')).toBeVisible();
		await expect(page.locator('.logout-button')).toContainText('Logout');
	});

	test.skip('should access admin pages after login', async ({ page }) => {
		// Login first
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');

		// Should be able to access / (upload)
		await page.goto('/');
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('.dropzone')).toBeVisible();

		// Should be able to access /share-existing
		await page.goto('/share-existing');
		await expect(page).toHaveURL(/\/share-existing/);
	});

	test.skip('should logout and redirect to login', async ({ page }) => {
		// Login first
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');

		// Click logout
		await page.click('.logout-button');

		// Should redirect to /login
		await expect(page).toHaveURL(/\/login/);

		// Should not be able to access protected routes
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});

	test.skip('should preserve session across page reloads', async ({ page }) => {
		// Login
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');

		// Reload page
		await page.reload();

		// Should still be authenticated
		await expect(page.locator('.logout-button')).toBeVisible();
	});

	test.skip('should handle rate limiting on login', async ({ page }) => {
		await page.goto('/login');

		// Try 4 times with wrong password (rate limit is 3/min)
		for (let i = 0; i < 4; i++) {
			await page.fill('input[type="password"]', 'wrongpassword');
			await page.click('button[type="submit"]');
			await page.waitForTimeout(100);
		}

		// 4th attempt should show rate limit error
		await expect(page.locator('.error')).toContainText('Too many');
	});
});

test.describe('Public Routes (No Auth)', () => {
	test('should allow download without auth', async ({ page }) => {
		// /download/[token] should be accessible without authentication
		// even when AUTH_ENABLED=true
		await page.goto('/download/test-token-12345678901234567890');

		// Should not redirect to login
		await expect(page).not.toHaveURL(/\/login/);
	});

	test.skip('should allow access to /api/auth/status without auth', async ({ request }) => {
		const response = await request.get('/api/auth/status');
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('authEnabled');
		expect(data).toHaveProperty('authenticated');
	});
});

test.describe('Auth Disabled Mode (Default)', () => {
	test('should allow access to / when auth disabled', async ({ page }) => {
		// When AUTH_ENABLED=false (default), no redirect
		await page.goto('/');

		// Should stay on /
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('.dropzone')).toBeVisible();
	});

	test('should not show logout button when auth disabled', async ({ page }) => {
		await page.goto('/');

		// Logout button should not be visible
		await expect(page.locator('.logout-button')).not.toBeVisible();
	});
});
