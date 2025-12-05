<script lang="ts">
	import { onMount } from 'svelte';
	import { buildInfo } from '$lib/buildInfo';

	interface AuditLog {
		id: number;
		timestamp: number;
		event_type: string;
		user_type: string;
		ip_address: string;
		action: string;
		status: string;
		resource_id?: string;
	}

	let logs = $state<AuditLog[]>([]);
	let loading = $state(true);
	let filter = $state('all');

	onMount(async () => {
		await loadLogs();
	});

	async function loadLogs() {
		loading = true;
		try {
			const params = filter !== 'all' ? `?type=${filter}&limit=50` : '?limit=50';
			const response = await fetch(`/api/audit/logs${params}`);
			const data = await response.json();
			logs = data.logs;
		} catch (err) {
			console.error('Failed to load logs:', err);
		} finally {
			loading = false;
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	function getEventBadge(eventType: string): string {
		const badges: Record<string, string> = {
			authentication: '🔐',
			upload: '📤',
			download: '📥',
			link_creation: '🔗',
			browse: '📂'
		};
		return badges[eventType] || '📋';
	}
</script>

<svelte:head>
	<title>Admin Dashboard - PrivaSend</title>
</svelte:head>

<main>
	<div class="container">
		<header>
			<h1>Admin Dashboard</h1>
			<p class="subtitle">Activity logs and system overview</p>
		</header>

		<nav class="mode-nav">
			<a href="/" class="nav-link">📤 Upload</a>
			<a href="/share-existing" class="nav-link">📂 Share</a>
			<a href="/admin" class="nav-link active">📊 Logs</a>
			<a href="/admin/files" class="nav-link">📁 Files</a>
		</nav>

		<div class="content-section">
			<div class="filters">
				<label>
					Filter:
					<select bind:value={filter} onchange={loadLogs}>
						<option value="all">All Events</option>
						<option value="authentication">Authentication</option>
						<option value="upload">Uploads</option>
						<option value="download">Downloads</option>
						<option value="link_creation">Link Creation</option>
					</select>
				</label>
				<button onclick={loadLogs}>Refresh</button>
			</div>

			{#if loading}
				<div class="loading">Loading logs...</div>
			{:else if logs.length === 0}
				<div class="empty">No audit logs found</div>
			{:else}
				<div class="logs-table">
					<table>
						<thead>
							<tr>
								<th>Time</th>
								<th>Event</th>
								<th>User</th>
								<th>IP</th>
								<th>Action</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{#each logs as log}
								<tr>
									<td class="time">{formatDate(log.timestamp)}</td>
									<td>
										<span class="event-badge">
											{getEventBadge(log.event_type)}
											{log.event_type}
										</span>
									</td>
									<td>{log.user_type}</td>
									<td class="mono">{log.ip_address}</td>
									<td>{log.action}</td>
									<td>
										<span class="status" class:success={log.status === 'success'}>
											{log.status}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<footer>
			<p>PrivaSend v{buildInfo.version}</p>
		</footer>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
		min-height: 100vh;
	}

	main {
		padding: 2rem;
		min-height: 100vh;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
		color: white;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		font-size: 1.1rem;
		opacity: 0.9;
		margin: 0;
	}

	.mode-nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		justify-content: center;
	}

	.nav-link {
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		transition: background 0.2s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.nav-link.active {
		background: white;
		color: var(--accent);
		font-weight: 600;
	}

	.content-section {
		background: var(--bg-primary);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		min-height: 500px;
	}

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		align-items: center;
	}

	.filters label {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		color: var(--text-primary);
	}

	.filters select {
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.filters button {
		padding: 0.5rem 1rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.filters button:hover {
		background: var(--accent-hover);
	}

	.loading,
	.empty {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.logs-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 2px solid var(--border-color);
		color: var(--text-primary);
		font-weight: 600;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--border-color);
		color: var(--text-primary);
	}

	.time {
		font-size: 0.85rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.mono {
		font-family: monospace;
		font-size: 0.85rem;
	}

	.event-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border-radius: 0.25rem;
		font-size: 0.85rem;
	}

	.status {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.85rem;
		background: var(--error-bg);
		color: var(--error-text);
	}

	.status.success {
		background: var(--success-bg);
		color: var(--success-text);
	}

	footer {
		text-align: center;
		margin-top: 2rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.85rem;
	}
</style>
