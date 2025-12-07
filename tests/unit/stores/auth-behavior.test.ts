import { describe, it, expect, vi } from 'vitest';
import { auth } from '$lib/stores/auth';

describe('Auth Store - Behavior Tests', () => {
	it('should call fetch on checkStatus', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ authenticated: true, authEnabled: true })
		});

		await auth.checkStatus();

		expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
	});

	it('should update state after checkStatus', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ authenticated: true, authEnabled: true })
		});

		await auth.checkStatus();

		// State should be updated
		let currentState: unknown;
		auth.subscribe((state) => (currentState = state))();
		expect(currentState.loading).toBe(false);
	});

	it('should call logout API', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: true });

		await auth.logout();

		expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
	});
});
