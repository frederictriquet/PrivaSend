<script lang="ts">
	interface FileEntry {
		name: string;
		relativePath: string;
		size: number;
		isDirectory: boolean;
		mimeType: string;
		lastModified: Date;
	}

	interface ShareLinkResult {
		token: string;
		url: string;
		fileName: string;
		fileSize: number;
		expiresAt: string;
	}

	let files: FileEntry[] = $state([]);
	let currentPath: string = $state('');
	let loading: boolean = $state(false);
	let error: string | null = $state(null);
	let shareLink: ShareLinkResult | null = $state(null);
	let copied: boolean = $state(false);

	// Load on mount
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
			files = data.files || [];
			currentPath = path;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load files';
			if (error.includes('not enabled')) {
				error = 'Shared volume feature is not enabled. Set SHARED_VOLUME_ENABLED=true';
			}
		} finally {
			loading = false;
		}
	}

	async function shareFile(file: FileEntry) {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/shared/link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					relativePath: file.relativePath
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create share link');
			}

			const data = await response.json();
			shareLink = data.link;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to share file';
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard() {
		if (!shareLink) return;

		const fullUrl = `${window.location.origin}${shareLink.url}`;

		try {
			await navigator.clipboard.writeText(fullUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
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

	function goBack() {
		const parts = currentPath.split('/').filter(Boolean);
		parts.pop();
		const parentPath = parts.join('/');
		loadFiles(parentPath);
	}

	function resetShare() {
		shareLink = null;
		copied = false;
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
			{#if !shareLink}
				<div class="browser-section">
					<div class="breadcrumb">
						<span class="path-label">Current path:</span>
						<span class="current-path">/{currentPath || 'root'}</span>
						{#if currentPath}
							<button class="back-button" onclick={goBack}>← Back</button>
						{/if}
					</div>

					{#if loading}
						<div class="loading">Loading...</div>
					{:else if error}
						<div class="error-message">
							<svg
								class="error-icon"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p>{error}</p>
						</div>
					{:else if files.length === 0}
						<div class="empty-state">
							<p>No files in this directory</p>
						</div>
					{:else}
						<div class="file-list">
							{#each files as file}
								<div class="file-item">
									<div class="file-info">
										<span class="file-icon">{getFileIcon(file)}</span>
										<div class="file-details">
											<div class="file-name">{file.name}</div>
											<div class="file-meta">
												{#if !file.isDirectory}
													{formatBytes(file.size)} • {formatDate(file.lastModified)}
												{:else}
													Directory
												{/if}
											</div>
										</div>
									</div>
									<div class="file-actions">
										{#if file.isDirectory}
											<button class="action-button" onclick={() => loadFiles(file.relativePath)}>
												Open →
											</button>
										{:else}
											<button
												class="action-button primary"
												onclick={() => shareFile(file)}
												disabled={loading}
											>
												Share
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="success-message">
					<svg
						class="success-icon"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h2>Share link created!</h2>
					<p class="file-name">{shareLink.fileName}</p>
					<p class="file-size">{formatBytes(shareLink.fileSize)}</p>

					<div class="share-link-box">
						<label for="shareLink">Share this link:</label>
						<div class="link-input-group">
							<input
								type="text"
								id="shareLink"
								readonly
								value="{window.location.origin}{shareLink.url}"
								onclick={(e) => e.currentTarget.select()}
							/>
							<button class="copy-button" onclick={copyToClipboard} title="Copy to clipboard">
								{#if copied}
									✓ Copied!
								{:else}
									📋 Copy
								{/if}
							</button>
						</div>
						<p class="link-info">Link expires in 7 days</p>
					</div>

					<button class="button-secondary" onclick={resetShare}>Share another file</button>
				</div>
			{/if}
		</div>

		<footer>
			<p>Phase 1.5 - Shared Volume File Sharing</p>
		</footer>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	main {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.container {
		max-width: 800px;
		width: 100%;
	}

	header {
		text-align: center;
		color: white;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		font-weight: 700;
	}

	.subtitle {
		font-size: 1rem;
		margin: 0;
		opacity: 0.9;
	}

	.mode-nav {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem;
		border-radius: 0.5rem;
	}

	.nav-link {
		flex: 1;
		padding: 0.75rem 1.5rem;
		text-align: center;
		color: white;
		text-decoration: none;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.nav-link.active {
		background: white;
		color: #667eea;
		font-weight: 600;
	}

	.content-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		min-height: 400px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.path-label {
		font-weight: 600;
		color: #718096;
	}

	.current-path {
		font-family: 'Monaco', monospace;
		color: #2d3748;
	}

	.back-button {
		margin-left: auto;
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.file-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.file-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.file-item:hover {
		border-color: #667eea;
		background: #f7fafc;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.file-icon {
		font-size: 2rem;
	}

	.file-details {
		flex: 1;
	}

	.file-name {
		font-weight: 500;
		color: #2d3748;
		margin-bottom: 0.25rem;
	}

	.file-meta {
		font-size: 0.875rem;
		color: #718096;
	}

	.action-button {
		padding: 0.5rem 1.5rem;
		border: 2px solid #667eea;
		background: white;
		color: #667eea;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	.action-button:hover:not(:disabled) {
		background: #667eea;
		color: white;
	}

	.action-button.primary {
		background: #667eea;
		color: white;
	}

	.action-button.primary:hover:not(:disabled) {
		background: #5a67d8;
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #718096;
	}

	.error-message {
		text-align: center;
		padding: 2rem;
	}

	.error-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
		color: #f56565;
	}

	.error-message p {
		color: #f56565;
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #718096;
	}

	.success-message {
		text-align: center;
		padding: 1rem 0;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
		color: #48bb78;
	}

	.success-message h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 1.5rem;
	}

	.file-size {
		margin: 0 0 1.5rem 0;
		color: #718096;
		font-size: 0.875rem;
	}

	.share-link-box {
		background: #f7fafc;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin: 1.5rem 0;
	}

	.share-link-box label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #2d3748;
		margin-bottom: 0.75rem;
	}

	.link-input-group {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.link-input-group input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-family: 'Monaco', monospace;
		font-size: 0.875rem;
	}

	.copy-button {
		padding: 0.75rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		white-space: nowrap;
	}

	.copy-button:hover {
		background: #5a67d8;
	}

	.link-info {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
		text-align: center;
	}

	.button-secondary {
		background: white;
		border: 2px solid #667eea;
		color: #667eea;
		padding: 0.75rem 2rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.button-secondary:hover {
		background: #667eea;
		color: white;
	}

	footer {
		text-align: center;
		color: white;
		margin-top: 2rem;
		opacity: 0.8;
		font-size: 0.875rem;
	}
</style>
