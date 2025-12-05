<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		auth.checkStatus();
	});

	function handleLogout() {
		auth.logout();
	}

	function toggleTheme() {
		theme.toggle();
	}

	// Don't show nav on login/download pages
	let isLoginPage = $derived($page.url.pathname === '/login');
	let isDownloadPage = $derived($page.url.pathname.startsWith('/download/'));
	let showNav = $derived(!isLoginPage && !isDownloadPage);

	let currentPath = $derived($page.url.pathname);
</script>

{#if showNav}
	<nav class="global-nav">
		<a href="/" class="nav-link" class:active={currentPath === '/'}>📤 Upload</a>
		<a href="/share-existing" class="nav-link" class:active={currentPath === '/share-existing'}
			>📂 Share</a
		>
		<a href="/admin" class="nav-link" class:active={currentPath === '/admin'}>📊 Logs</a>
		<a href="/admin/files" class="nav-link" class:active={currentPath === '/admin/files'}
			>📁 Files</a
		>
	</nav>
{/if}

<div class="controls-container">
	<button class="theme-toggle" onclick={toggleTheme} title="Toggle dark mode">
		{$theme === 'light' ? '🌙' : '☀️'}
	</button>

	{#if !isLoginPage}
		<button class="logout-button" onclick={handleLogout}>Logout</button>
	{/if}
</div>

{@render children()}

<style>
	.global-nav {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 1000;
		display: flex;
		gap: 0.5rem;
	}

	.nav-link {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.9);
		color: var(--accent);
		text-decoration: none;
		border-radius: 6px;
		transition: all 0.2s;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.nav-link:hover {
		background: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.nav-link.active {
		background: var(--accent);
		color: white;
	}

	.controls-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1000;
		display: flex;
		gap: 0.5rem;
	}

	.theme-toggle,
	.logout-button {
		padding: 0.5rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.theme-toggle {
		font-size: 1.2rem;
		padding: 0.5rem 0.75rem;
	}

	.theme-toggle:hover,
	.logout-button:hover {
		background: var(--bg-secondary);
		border-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
</style>
