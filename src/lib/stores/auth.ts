import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

interface AuthState {
	isAuthenticated: boolean;
	authEnabled: boolean;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isAuthenticated: false,
		authEnabled: false,
		loading: true
	});

	return {
		subscribe,
		async checkStatus() {
			try {
				const response = await fetch('/api/auth/status');
				const data = await response.json();

				update((state) => ({
					...state,
					isAuthenticated: data.authenticated,
					authEnabled: data.authEnabled,
					loading: false
				}));
			} catch (err) {
				console.error('Failed to check auth status:', err);
				update((state) => ({ ...state, loading: false }));
			}
		},
		async logout() {
			try {
				await fetch('/api/auth/logout', { method: 'POST' });
				set({ isAuthenticated: false, authEnabled: true, loading: false });
				goto('/login');
			} catch (err) {
				console.error('Logout failed:', err);
			}
		}
	};
}

export const auth = createAuthStore();
