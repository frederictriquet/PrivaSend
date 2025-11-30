<script lang="ts">
	import { nanoid } from 'nanoid';
	import { buildInfo } from '$lib/buildInfo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface ShareLink {
		token: string;
		url: string;
		expiresAt: string;
	}

	interface UploadState {
		uploading: boolean;
		progress: number;
		fileName: string;
		fileSize: number;
		error: string | null;
		success: boolean;
		fileId: string | null;
		shareLink: ShareLink | null;
	}

	let state: UploadState = $state({
		uploading: false,
		progress: 0,
		fileName: '',
		fileSize: 0,
		error: null,
		success: false,
		fileId: null,
		shareLink: null
	});

	let copied: boolean = $state(false);

	let isDragging: boolean = $state(false);
	let fileInput: HTMLInputElement | undefined = $state(undefined);

	const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
	const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			await uploadFile(files[0]);
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			uploadFile(files[0]);
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}

	async function uploadFile(file: File) {
		// Reset state
		state = {
			uploading: true,
			progress: 0,
			fileName: file.name,
			fileSize: file.size,
			error: null,
			success: false,
			fileId: null,
			shareLink: null
		};
		copied = false;

		try {
			// Validate file size
			if (file.size > MAX_FILE_SIZE) {
				throw new Error(`File size exceeds maximum allowed size of ${formatBytes(MAX_FILE_SIZE)}`);
			}

			// Use chunked upload for files larger than 10MB
			if (file.size > 10 * 1024 * 1024) {
				await uploadFileInChunks(file);
			} else {
				await uploadFileDirectly(file);
			}

			state.success = true;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Upload failed';
			state.uploading = false;
		}
	}

	async function uploadFileDirectly(file: File) {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
			throw new Error(errorData.message || 'Upload failed');
		}

		const result = await response.json();
		state.fileId = result.fileId;
		state.shareLink = result.shareLink;
		state.progress = 100;
		state.uploading = false;
	}

	async function uploadFileInChunks(file: File) {
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		const fileId = nanoid(21);

		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);

			const arrayBuffer = await chunk.arrayBuffer();

			const response = await fetch('/api/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/octet-stream',
					'X-File-Id': fileId,
					'X-Chunk-Index': chunkIndex.toString(),
					'X-Total-Chunks': totalChunks.toString(),
					'X-File-Name': file.name,
					'X-Mime-Type': file.type || 'application/octet-stream'
				},
				body: arrayBuffer
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(errorData.message || 'Upload failed');
			}

			// Update progress
			state.progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);

			// Check if upload is complete
			const result = await response.json();
			if (result.complete) {
				state.fileId = result.fileId;
				state.shareLink = result.shareLink;
				state.uploading = false;
			}
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	async function copyToClipboard() {
		if (!state.shareLink) return;

		const fullUrl = `${window.location.origin}${state.shareLink.url}`;

		try {
			await navigator.clipboard.writeText(fullUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = fullUrl;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				copied = true;
				setTimeout(() => {
					copied = false;
				}, 2000);
			} catch (err) {
				console.error('Fallback copy failed:', err);
			}
			document.body.removeChild(textArea);
		}
	}

	function resetUpload() {
		state = {
			uploading: false,
			progress: 0,
			fileName: '',
			fileSize: 0,
			error: null,
			success: false,
			fileId: null,
			shareLink: null
		};
		copied = false;
		if (fileInput) fileInput.value = '';
	}
</script>

<svelte:head>
	<title>PrivaSend - Secure File Sharing</title>
</svelte:head>

<main>
	<div class="container">
		<header>
			<h1>PrivaSend</h1>
			<p class="subtitle">Secure File Sharing for Your Private Network</p>
		</header>

		<nav class="mode-nav">
			<a href="/" class="nav-link active">📤 Upload File</a>
			<a href="/share-existing" class="nav-link">📂 Share Existing</a>
		</nav>

		<div class="upload-section">
			{#if !state.uploading && !state.success && !state.error}
				<div
					class="dropzone"
					class:dragging={isDragging}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					role="button"
					tabindex="0"
					onclick={openFileDialog}
					onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
				>
					<svg
						class="upload-icon"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<h2>Drop your file here</h2>
					<p>or click to browse</p>
					<p class="size-limit">Maximum file size: 5 GB</p>
				</div>

				<input
					bind:this={fileInput}
					type="file"
					onchange={handleFileSelect}
					style="display: none;"
					aria-label="File input"
				/>
			{/if}

			{#if state.uploading}
				<div class="upload-progress">
					<div class="file-info">
						<svg
							class="file-icon"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
						<div class="file-details">
							<h3>{state.fileName}</h3>
							<p>{formatBytes(state.fileSize)}</p>
						</div>
					</div>

					<div class="progress-bar">
						<div class="progress-fill" style="width: {state.progress}%"></div>
					</div>
					<p class="progress-text">{state.progress}% uploaded</p>
				</div>
			{/if}

			{#if state.success && state.fileId && state.shareLink}
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
					<h2>File uploaded successfully!</h2>
					<p class="file-name">{state.fileName}</p>
					<p class="file-size">{formatBytes(state.fileSize)}</p>

					<div class="share-link-box">
						<label for="shareLink">Share this link:</label>
						<div class="link-input-group">
							<input
								type="text"
								id="shareLink"
								readonly
								value="{window.location.origin}{state.shareLink.url}"
								onclick={(e) => e.currentTarget.select()}
							/>
							<button class="copy-button" onclick={copyToClipboard} title="Copy to clipboard">
								{#if copied}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Copied!
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
									Copy
								{/if}
							</button>
						</div>
						<p class="link-info">
							Link expires in 7 days • Anyone with this link can download the file
						</p>
					</div>

					<button class="button-secondary" onclick={resetUpload}>Upload another file</button>
				</div>
			{/if}

			{#if state.error}
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
					<h2>Upload failed</h2>
					<p class="error-text">{state.error}</p>
					<button class="button-secondary" onclick={resetUpload}>Try again</button>
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
		max-width: 600px;
		width: 100%;
	}

	header {
		text-align: center;
		color: white;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 3rem;
		margin: 0 0 0.5rem 0;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.subtitle {
		font-size: 1.1rem;
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

	.upload-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.dropzone {
		border: 3px dashed #cbd5e0;
		border-radius: 0.5rem;
		padding: 3rem 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		background: #f7fafc;
	}

	.dropzone:hover,
	.dropzone:focus {
		border-color: #667eea;
		background: #edf2f7;
		outline: none;
	}

	.dropzone.dragging {
		border-color: #667eea;
		background: #e6f2ff;
		transform: scale(1.02);
	}

	.upload-icon {
		width: 64px;
		height: 64px;
		color: #667eea;
		margin: 0 auto 1rem;
	}

	.dropzone h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #2d3748;
	}

	.dropzone p {
		margin: 0.5rem 0;
		color: #718096;
		font-size: 1rem;
	}

	.size-limit {
		margin-top: 1rem !important;
		font-size: 0.875rem !important;
		color: #a0aec0 !important;
	}

	.upload-progress {
		text-align: center;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.file-icon {
		width: 48px;
		height: 48px;
		color: #667eea;
		flex-shrink: 0;
	}

	.file-details {
		text-align: left;
		flex: 1;
	}

	.file-details h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: #2d3748;
		word-break: break-all;
	}

	.file-details p {
		margin: 0;
		font-size: 0.875rem;
		color: #718096;
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

	.success-message,
	.error-message {
		text-align: center;
		padding: 1rem 0;
	}

	.success-icon,
	.error-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
	}

	.success-icon {
		color: #48bb78;
	}

	.error-icon {
		color: #f56565;
	}

	.success-message h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 1.5rem;
	}

	.error-message h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 1.5rem;
	}

	.file-name {
		margin: 0.5rem 0;
		color: #2d3748;
		font-weight: 500;
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
		text-align: left;
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
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
		color: #2d3748;
		background: white;
		cursor: pointer;
	}

	.link-input-group input:focus {
		outline: none;
		border-color: #667eea;
	}

	.copy-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.copy-button:hover {
		background: #5a67d8;
	}

	.copy-button svg {
		width: 16px;
		height: 16px;
	}

	.link-info {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
		text-align: center;
	}

	.error-text {
		color: #f56565;
		margin: 0.5rem 0 1.5rem 0;
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
		transition: all 0.2s ease;
	}

	.button-secondary:hover {
		background: #667eea;
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	footer {
		text-align: center;
		color: white;
		margin-top: 2rem;
		opacity: 0.8;
		font-size: 0.875rem;
	}

	footer p {
		margin: 0;
	}
</style>
