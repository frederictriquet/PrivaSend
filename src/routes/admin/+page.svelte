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

	interface Stats {
		links: { total: number; uploads: number; shared: number };
		downloads: { total: number };
		storage: { used: number; fileCount: number };
		activity24h: { uploads: number; downloads: number };
	}

	let logs = $state<AuditLog[]>([]);
	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let filter = $state('all');

	onMount(async () => {
		await Promise.all([loadLogs(), loadStats()]);
	});

	async function loadStats() {
		try {
			const response = await fetch('/api/admin/stats');
			const data = await response.json();
			stats = data;
		} catch (err) {
			console.error('Failed to load stats:', err);
		}
	}

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

		{#if stats}
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">{stats.links.total}</div>
					<div class="stat-label">Total Share Links</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{stats.downloads.total}</div>
					<div class="stat-label">Total Downloads</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{stats.storage.fileCount}</div>
					<div class="stat-label">Files Stored</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{(stats.storage.used / 1024 / 1024).toFixed(1)} MB</div>
					<div class="stat-label">Storage Used</div>
				</div>
			</div>
		{/if}

		<div class="content-section">
			<h2 class="section-title">Audit Logs</h2>
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

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: var(--bg-primary);
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.section-title {
		color: var(--text-primary);
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
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
