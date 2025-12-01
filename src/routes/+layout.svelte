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

	// Don't show logout button on login page
	let isLoginPage = $derived($page.url.pathname === '/login');
</script>

<div class="controls-container">
	<button class="theme-toggle" onclick={toggleTheme} title="Toggle dark mode">
		{$theme === 'light' ? '🌙' : '☀️'}
	</button>

	{#if $auth.authEnabled && $auth.isAuthenticated && !isLoginPage}
		<button class="logout-button" onclick={handleLogout}>Logout</button>
	{/if}
</div>

{@render children()}

<style>
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
		background: white;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.theme-toggle {
		font-size: 1.2rem;
		padding: 0.5rem 0.75rem;
	}

	.theme-toggle:hover,
	.logout-button:hover {
		background: #f5f5f5;
		border-color: #667eea;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
</style>
