import { test, expect } from '@playwright/test';

const authEnabled = process.env.AUTH_ENABLED === 'true';

test.describe('Authentication Flow', () => {
	test.skip(!authEnabled, 'Requires AUTH_ENABLED=true');

	test.beforeEach(async ({ request }) => {
		await request.post('/api/test/reset-rate-limiter');
	});

	test('should show login page', async ({ page }) => {
		await page.goto('/login');

		await expect(page).toHaveTitle(/Admin Login/);
		await expect(page.locator('h2')).toContainText('Admin Login');
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('should redirect to login when accessing / without auth', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});

	test('should redirect to login when accessing /share-existing without auth', async ({ page }) => {
		await page.goto('/share-existing');
		await expect(page).toHaveURL(/\/login/);
	});

	test('should show error with wrong password', async ({ page }) => {
		await page.goto('/login');

		await page.fill('input[type="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		await expect(page.locator('.error')).toBeVisible();
		await expect(page.locator('.error')).toContainText('Invalid password');
	});

	test('should login successfully with correct password', async ({ page }) => {
		await page.goto('/login');

		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL(/\/$/);
	});

	test('should show logout button when authenticated', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/$/);

		await expect(page.locator('.logout-button')).toBeVisible();
		await expect(page.locator('.logout-button')).toContainText('Logout');
	});

	test('should access admin pages after login', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/$/);

		await page.goto('/');
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('.dropzone')).toBeVisible();

		await page.goto('/share-existing');
		await expect(page).toHaveURL(/\/share-existing/);
	});

	test('should logout and redirect to login', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/$/);

		await page.click('.logout-button');

		await expect(page).toHaveURL(/\/login/);

		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});

	test('should preserve session across page reloads', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'testpass');
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/$/);

		await page.reload();

		await expect(page.locator('.logout-button')).toBeVisible();
	});

	test('should handle rate limiting on login', async ({ page }) => {
		await page.goto('/login');

		for (let i = 0; i < 4; i++) {
			await page.fill('input[type="password"]', 'wrongpassword');
			await page.click('button[type="submit"]');
			await page.waitForTimeout(100);
		}

		await expect(page.locator('.error')).toContainText('Too many');
	});
});

test.describe('Public Routes (No Auth)', () => {
	test('should allow download without auth', async ({ page }) => {
		await page.goto('/download/test-token-12345678901234567890');

		await expect(page).not.toHaveURL(/\/login/);
	});

	test('should allow access to /api/auth/status without auth', async ({ request }) => {
		const response = await request.get('/api/auth/status');
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('authEnabled');
		expect(data).toHaveProperty('authenticated');
	});
});

test.describe('Auth Disabled Mode (Default)', () => {
	test.skip(authEnabled, 'Only runs when AUTH_ENABLED is not true');

	test('should allow access to / when auth disabled', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('.dropzone')).toBeVisible();
	});

	test('should not show logout button when auth disabled', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('.logout-button')).not.toBeVisible();
	});
});
