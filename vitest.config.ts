import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', 'build/', '.svelte-kit/']
			// Thresholds disabled until more tests are written
			// thresholds: {
			// 	lines: 80,
			// 	functions: 80,
			// 	branches: 80,
			// 	statements: 80
			// }
		},
		globals: true,
		environment: 'node'
	}
});
