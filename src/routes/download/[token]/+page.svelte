<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let downloading = $state(false);
	let downloadProgress = $state(0);

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	}

	function getFileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType.startsWith('video/')) return '🎥';
		if (mimeType.startsWith('audio/')) return '🎵';
		if (mimeType.includes('pdf')) return '📄';
		if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
		if (mimeType.includes('text')) return '📝';
		return '📁';
	}

	async function downloadFile() {
		downloading = true;
		downloadProgress = 0;

		try {
			const response = await fetch(`/download/${data.token}`, {
				method: 'GET'
			});

			if (!response.ok) {
				throw new Error('Download failed');
			}

			// Get total file size
			const contentLength = response.headers.get('content-length');
			const total = contentLength ? parseInt(contentLength, 10) : 0;

			// Read stream with progress
			const reader = response.body?.getReader();
			if (!reader) throw new Error('No reader available');

			const chunks: Uint8Array[] = [];
			let received = 0;

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				chunks.push(value);
				received += value.length;

				if (total > 0) {
					downloadProgress = Math.round((received / total) * 100);
				}
			}

			// Create blob and download
			const blob = new Blob(chunks);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = data.fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			downloadProgress = 100;
		} catch (error) {
			console.error('Download error:', error);
			alert('Download failed. Please try again.');
		} finally {
			setTimeout(() => {
				downloading = false;
				downloadProgress = 0;
			}, 2000);
		}
	}

	// Calculate time remaining
	const expiresAt = new Date(data.expiresAt);
	const now = new Date();
	const timeRemaining = expiresAt.getTime() - now.getTime();
	const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
	const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
</script>

<svelte:head>
	<title>Download {data.fileName} - PrivaSend</title>
</svelte:head>

<main>
	<div class="container">
		<header>
			<h1>PrivaSend</h1>
			<p class="subtitle">Secure File Download</p>
		</header>

		<div class="download-card">
			<div class="file-preview">
				<div class="file-icon">{getFileIcon(data.mimeType)}</div>
				<h2 class="file-name">{data.fileName}</h2>
				<p class="file-size">{formatBytes(data.fileSize)}</p>
			</div>

			<div class="file-info">
				<div class="info-row">
					<span class="info-label">Uploaded:</span>
					<span class="info-value">{formatDate(data.uploadedAt)}</span>
				</div>

				<div class="info-row">
					<span class="info-label">Expires:</span>
					<span class="info-value">
						{#if daysRemaining > 0}
							in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
							{#if hoursRemaining > 0}
								and {hoursRemaining} hour{hoursRemaining === 1 ? '' : 's'}
							{/if}
						{:else if hoursRemaining > 0}
							in {hoursRemaining} hour{hoursRemaining === 1 ? '' : 's'}
						{:else}
							soon
						{/if}
					</span>
				</div>

				{#if data.maxDownloads !== null}
					<div class="info-row">
						<span class="info-label">Downloads:</span>
						<span class="info-value">
							{data.downloadCount} / {data.maxDownloads}
						</span>
					</div>
				{/if}
			</div>

			{#if !downloading}
				<button class="download-button" onclick={downloadFile}>
					<svg
						class="download-icon"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					Download File
				</button>
			{:else}
				<div class="download-progress">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {downloadProgress}%"></div>
					</div>
					<p class="progress-text">
						{#if downloadProgress < 100}
							Downloading... {downloadProgress}%
						{:else}
							Download complete!
						{/if}
					</p>
				</div>
			{/if}

			<p class="security-note">
				🔒 This file is hosted securely on a private network
			</p>
		</div>

		<footer>
			<a href="/">Upload a file</a>
		</footer>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
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
		max-width: 600px;
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
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.subtitle {
		font-size: 1rem;
		margin: 0;
		opacity: 0.9;
	}

	.download-card {
		background: white;
		border-radius: 1rem;
		padding: 2.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.file-preview {
		text-align: center;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 2rem;
	}

	.file-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.file-name {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #2d3748;
		word-break: break-word;
	}

	.file-size {
		margin: 0;
		font-size: 1rem;
		color: #718096;
	}

	.file-info {
		margin-bottom: 2rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f7fafc;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-weight: 500;
		color: #718096;
	}

	.info-value {
		color: #2d3748;
		text-align: right;
	}

	.download-button {
		width: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.download-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
	}

	.download-button:active {
		transform: translateY(0);
	}

	.download-icon {
		width: 24px;
		height: 24px;
	}

	.download-progress {
		text-align: center;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		transition: width 0.3s ease;
		border-radius: 4px;
	}

	.progress-text {
		margin: 0;
		color: #718096;
		font-size: 0.875rem;
	}

	.security-note {
		text-align: center;
		margin: 2rem 0 0 0;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
		color: #718096;
		font-size: 0.875rem;
	}

	footer {
		text-align: center;
		margin-top: 2rem;
	}

	footer a {
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		opacity: 0.9;
		transition: opacity 0.2s;
	}

	footer a:hover {
		opacity: 1;
		text-decoration: underline;
	}
</style>
