<script lang="ts">
	import { onMount } from 'svelte';
	import { buildInfo } from '$lib/buildInfo';
	import QRCode from '$lib/components/QRCode.svelte';

	interface UploadedFile {
		fileId: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
		uploadedAt: string;
		shareLink: {
			token: string;
			url: string;
			expiresAt: string;
			downloadCount: number;
			maxDownloads: number | null;
		};
	}

	let files = $state<UploadedFile[]>([]);
	let loading = $state(true);
	let showQR: { url: string; fileName: string } | null = $state(null);
	let confirmDelete: string | null = $state(null);

	onMount(async () => {
		await loadFiles();
	});

	async function loadFiles() {
		loading = true;
		try {
			const response = await fetch('/api/admin/files');
			const data = await response.json();
			files = data.files;
		} catch (err) {
			console.error('Failed to load files:', err);
		} finally {
			loading = false;
		}
	}

	async function deleteFile(fileId: string) {
		try {
			const response = await fetch(`/api/admin/files?fileId=${fileId}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Delete failed');

			await loadFiles();
			confirmDelete = null;
		} catch (err) {
			console.error('Failed to delete:', err);
			alert('Failed to delete file');
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString();
	}
</script>

<svelte:head>
	<title>Manage Files - PrivaSend Admin</title>
</svelte:head>

<main>
	<div class="container">
		<header>
			<h1>Uploaded Files</h1>
			<p class="subtitle">Manage uploaded files and share links</p>
		</header>

		<nav class="mode-nav">
			<a href="/admin" class="nav-link">📊 Logs</a>
			<a href="/admin/files" class="nav-link active">📁 Files</a>
		</nav>

		<div class="content-section">
			{#if loading}
				<div class="loading">Loading files...</div>
			{:else if files.length === 0}
				<div class="empty">No uploaded files</div>
			{:else}
				<div class="file-list">
					{#each files as file}
						<div class="file-row">
							<div class="file-info">
								<span class="file-icon">📄</span>
								<div class="file-details">
									<div class="file-name" title={file.fileName}>{file.fileName}</div>
									<div class="file-meta">
										{formatBytes(file.fileSize)} • 📥 {file.shareLink.downloadCount} downloads
									</div>
								</div>
							</div>

							<div class="file-actions">
								<div class="share-link-inline">
									<input
										type="text"
										readonly
										value={`${window.location.origin}${file.shareLink.url}`}
										onclick={(e) => e.currentTarget.select()}
										class="link-input"
									/>
									<button
										class="btn-qr"
										onclick={() =>
											(showQR = {
												url: `${window.location.origin}${file.shareLink.url}`,
												fileName: file.fileName
											})}
										title="Show QR Code"
									>
										📱
									</button>
									<button
										class="btn-delete"
										onclick={() => (confirmDelete = file.fileId)}
										title="Delete file"
									>
										🗑️
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<footer>
			<p>PrivaSend v{buildInfo.version}</p>
		</footer>
	</div>
</main>

{#if showQR}
	<div
		class="modal"
		onclick={() => (showQR = null)}
		onkeydown={(e) => e.key === 'Escape' && (showQR = null)}
		role="button"
		tabindex="0"
	>
		<div class="modal-content">
			<h3>{showQR.fileName}</h3>
			<QRCode url={showQR.url} size={300} />
			<p class="hint">Scan to download</p>
			<button onclick={() => (showQR = null)}>Close</button>
		</div>
	</div>
{/if}

{#if confirmDelete}
	<div
		class="modal"
		onclick={() => (confirmDelete = null)}
		onkeydown={(e) => e.key === 'Escape' && (confirmDelete = null)}
		role="button"
		tabindex="0"
	>
		<div class="modal-content">
			<h3>⚠️ Confirm Delete</h3>
			<p>Delete file and remove share link?</p>
			<p class="warning">This will permanently delete the file from disk.</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={() => (confirmDelete = null)}>Cancel</button>
				<button class="btn-confirm" onclick={() => deleteFile(confirmDelete!)}>Delete</button>
			</div>
		</div>
	</div>
{/if}

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

	.loading,
	.empty {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.file-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.file-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: 0.5rem;
		transition: background 0.2s;
	}

	.file-row:hover {
		background: var(--bg-secondary);
	}

	.file-info {
		display: flex;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.file-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.file-details {
		flex: 1;
		min-width: 0;
	}

	.file-name {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
		word-break: break-word;
	}

	.file-meta {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.file-actions {
		min-width: 600px;
	}

	.share-link-inline {
		display: flex;
		gap: 0.5rem;
	}

	.link-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 0.375rem;
		font-family: monospace;
		font-size: 0.85rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.btn-qr,
	.btn-delete {
		padding: 0.5rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.2s;
	}

	.btn-qr {
		background: var(--accent);
		color: white;
	}

	.btn-qr:hover {
		background: var(--accent-hover);
	}

	.btn-delete {
		background: #dc2626;
		color: white;
	}

	.btn-delete:hover {
		background: #b91c1c;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.modal-content {
		background: var(--bg-primary);
		padding: 2rem;
		border-radius: 1rem;
		text-align: center;
		max-width: 400px;
	}

	.modal-content h3 {
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.modal-content p {
		color: var(--text-primary);
		margin: 0.5rem 0;
	}

	.hint {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.warning {
		color: var(--error-text);
		font-weight: 500;
	}

	.modal-content button {
		padding: 0.75rem 2rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		margin-top: 1rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.btn-cancel,
	.btn-confirm {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-cancel {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.btn-confirm {
		background: #dc2626;
		color: white;
	}

	.btn-confirm:hover {
		background: #b91c1c;
	}

	footer {
		text-align: center;
		margin-top: 2rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.85rem;
	}
</style>
