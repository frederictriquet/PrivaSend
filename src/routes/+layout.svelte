<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	onMount(() => {
		auth.checkStatus();
	});

	function handleLogout() {
		auth.logout();
	}

	// Don't show logout button on login page
	let isLoginPage = $derived($page.url.pathname === '/login');
</script>

{#if $auth.authEnabled && $auth.isAuthenticated && !isLoginPage}
	<div class="logout-container">
		<button class="logout-button" onclick={handleLogout}>Logout</button>
	</div>
{/if}

{@render children()}

<style>
	.logout-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1000;
	}

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

	.logout-button:hover {
		background: #f5f5f5;
		border-color: #667eea;
		color: #667eea;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
</style>
