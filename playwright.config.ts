import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const port = isCI ? 3000 : 5173;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: [['html'], ['json', { outputFile: 'test-results.json' }], ['list']],
	use: {
		baseURL,
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: isCI ? `node build` : 'npm run dev',
		url: baseURL,
		reuseExistingServer: !isCI
	}
});
