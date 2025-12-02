<script lang="ts">
	import { buildInfo } from '$lib/buildInfo';

	interface FileEntry {
		name: string;
		relativePath: string;
		size: number;
		isDirectory: boolean;
		mimeType: string;
		lastModified: Date;
	}

	interface FileWithShare extends FileEntry {
		isShared: boolean;
		shareLink: string | null;
		shareToken: string | null;
		loading: boolean;
		copied: boolean;
	}

	let files: FileWithShare[] = $state([]);
	let currentPath: string = $state('');
	let loading: boolean = $state(false);
	let error: string | null = $state(null);

	$effect(() => {
		loadFiles('');
	});

	async function loadFiles(path: string) {
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/shared/browse?path=${encodeURIComponent(path)}`);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to load files');
			}

			const data = await response.json();

			// Map files and check if they already have share links
			files = await Promise.all(
				(data.files || []).map(async (f: FileEntry) => {
					// Check if file already has a share link
					let existingLink = null;
					let existingToken = null;

					if (!f.isDirectory) {
						try {
							const linkResp = await fetch(
								`/api/shared/check-link?path=${encodeURIComponent(f.relativePath)}`
							);
							if (linkResp.ok) {
								const linkData = await linkResp.json();
								if (linkData.hasLink) {
									existingToken = linkData.token;
									existingLink = `${window.location.origin}/download/${linkData.token}`;
								}
							}
						} catch {
							// Ignore errors
						}
					}

					return {
						...f,
						isShared: !!existingLink,
						shareLink: existingLink,
						shareToken: existingToken,
						loading: false,
						copied: false
					};
				})
			);

			currentPath = path;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load files';
		} finally {
			loading = false;
		}
	}

	async function toggleShare(file: FileWithShare) {
		if (file.isDirectory) return;

		if (file.isShared) {
			// Unshare (just clear the UI, link still valid in DB)
			file.isShared = false;
			file.shareLink = null;
			file.shareToken = null;
		} else {
			// Create share link
			file.loading = true;

			try {
				const response = await fetch('/api/shared/link', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ relativePath: file.relativePath })
				});

				if (!response.ok) {
					throw new Error('Failed to create share link');
				}

				const data = await response.json();
				file.isShared = true;
				file.shareToken = data.link.token;
				file.shareLink = `${window.location.origin}${data.link.url}`;
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to share file';
			} finally {
				file.loading = false;
			}
		}
	}

	async function copyLink(file: FileWithShare, event: Event) {
		event.stopPropagation();
		if (!file.shareLink) return;

		try {
			await navigator.clipboard.writeText(file.shareLink);
			file.copied = true;
			setTimeout(() => {
				file.copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function navigateTo(file: FileEntry) {
		if (file.isDirectory) {
			loadFiles(file.relativePath);
		}
	}

	function goBack() {
		const parts = currentPath.split('/').filter(Boolean);
		parts.pop();
		loadFiles(parts.join('/'));
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function getFileIcon(file: FileEntry): string {
		if (file.isDirectory) return '📁';
		if (file.mimeType.startsWith('image/')) return '🖼️';
		if (file.mimeType.startsWith('video/')) return '🎥';
		if (file.mimeType.startsWith('audio/')) return '🎵';
		if (file.mimeType.includes('pdf')) return '📄';
		if (file.mimeType.includes('zip') || file.mimeType.includes('tar')) return '📦';
		return '📄';
	}
</script>

<svelte:head>
	<title>Share Existing Files - PrivaSend</title>
</svelte:head>

<main>
	<div class="container">
		<header>
			<h1>PrivaSend</h1>
			<p class="subtitle">Share Existing Files from Server</p>
		</header>

		<nav class="mode-nav">
			<a href="/" class="nav-link">📤 Upload File</a>
			<a href="/share-existing" class="nav-link active">📂 Share Existing</a>
		</nav>

		<div class="content-section">
			<div class="breadcrumb">
				<span class="path-label">Path:</span>
				<span class="current-path">/{currentPath || 'root'}</span>
				{#if currentPath}
					<button class="back-button" onclick={goBack}>← Back</button>
				{/if}
			</div>

			{#if loading}
				<div class="loading">Loading files...</div>
			{:else if error}
				<div class="error-box">{error}</div>
			{:else if files.length === 0}
				<div class="empty">No files in this directory</div>
			{:else}
				<div class="file-list">
					{#each files as file}
						<div class="file-row">
							<div
								class="file-info"
								onclick={() => navigateTo(file)}
								onkeydown={(e) => e.key === 'Enter' && navigateTo(file)}
								role="button"
								tabindex="0"
							>
								<span class="file-icon">{getFileIcon(file)}</span>
								<div class="file-details">
									<div class="file-name">{file.name}</div>
									<div class="file-meta">
										{#if !file.isDirectory}
											{formatBytes(file.size)}
										{/if}
									</div>
								</div>
							</div>

							{#if !file.isDirectory}
								<div class="share-controls">
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={file.isShared}
											onchange={() => toggleShare(file)}
											disabled={file.loading}
										/>
										<span>Share</span>
									</label>

									{#if file.loading}
										<span class="loading-text">Creating link...</span>
									{/if}

									{#if file.isShared && file.shareLink}
										<div class="share-link-inline">
											<input
												type="text"
												readonly
												value={file.shareLink}
												onclick={(e) => e.currentTarget.select()}
												class="link-input"
											/>
											<button class="copy-btn" onclick={(e) => copyLink(file, e)} title="Copy link">
												{file.copied ? '✓' : '📋'}
											</button>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<footer>
			<p>
				PrivaSend v{buildInfo.version} • Built on {new Date(
					buildInfo.buildDate
				).toLocaleDateString()} at {new Date(buildInfo.buildDate).toLocaleTimeString()}
			</p>
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
		background: var(--bg-primary);
		color: var(--accent);
		font-weight: 600;
	}

	.content-section {
		background: var(--bg-primary);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		min-height: 400px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.path-label {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.current-path {
		font-family: monospace;
		color: var(--text-primary);
	}

	.back-button {
		margin-left: auto;
		padding: 0.5rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.back-button:hover {
		background: var(--bg-secondary);
	}

	.loading,
	.error-box,
	.empty {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.error-box {
		background: var(--error-bg);
		color: var(--error-text);
		border-radius: 0.5rem;
	}

	.file-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.file-row {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
		transition: background 0.2s;
	}

	.file-row:hover {
		background: var(--bg-secondary);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		cursor: pointer;
	}

	.file-icon {
		font-size: 2rem;
	}

	.file-details {
		flex: 1;
	}

	.file-name {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.file-meta {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.share-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: stretch;
		flex: 1;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
		align-self: flex-end;
	}

	.checkbox-label input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.checkbox-label span {
		font-weight: 500;
		color: var(--accent);
	}

	.loading-text {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.share-link-inline {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	.link-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 0.375rem;
		font-size: 0.85rem;
		font-family: monospace;
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.link-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.copy-btn {
		padding: 0.5rem 0.75rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: background 0.2s;
	}

	.copy-btn:hover {
		background: var(--accent-hover);
	}

	footer {
		text-align: center;
		margin-top: 2rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.85rem;
	}

	footer p {
		margin: 0;
	}
</style>
