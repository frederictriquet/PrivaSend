import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const stored = browser ? localStorage.getItem('theme') : null;
	const initial: Theme = (stored as Theme) || 'light';

	const { subscribe, set } = writable<Theme>(initial);

	// Apply theme on init
	if (browser && initial) {
		document.documentElement.setAttribute('data-theme', initial);
	}

	return {
		subscribe,
		toggle() {
			const current = get({ subscribe });
			const newTheme = current === 'light' ? 'dark' : 'light';
			this.set(newTheme);
		},
		set(newTheme: Theme) {
			if (browser) {
				localStorage.setItem('theme', newTheme);
				document.documentElement.setAttribute('data-theme', newTheme);
			}
			set(newTheme);
		}
	};
}

export const theme = createThemeStore();
