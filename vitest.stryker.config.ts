import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		pool: 'forks',
		globals: true,
		environment: 'node',
		poolOptions: {
			forks: {
				singleFork: true
			}
		}
	}
});
