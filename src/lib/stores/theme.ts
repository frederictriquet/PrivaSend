import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const stored = browser ? localStorage.getItem('theme') : null;
	const initial: Theme = (stored as Theme) || 'light';

	const store = writable<Theme>(initial);
	let currentTheme = initial;

	// Apply theme on init
	if (browser && initial) {
		document.documentElement.setAttribute('data-theme', initial);
	}

	// Subscribe to update current value
	store.subscribe((value) => {
		currentTheme = value;
	});

	return {
		subscribe: store.subscribe,
		toggle() {
			const newTheme = currentTheme === 'light' ? 'dark' : 'light';
			this.set(newTheme);
		},
		set(newTheme: Theme) {
			if (browser) {
				localStorage.setItem('theme', newTheme);
				document.documentElement.setAttribute('data-theme', newTheme);
			}
			store.set(newTheme);
		}
	};
}

export const theme = createThemeStore();
