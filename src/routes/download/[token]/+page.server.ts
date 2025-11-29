import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { database } from '$lib/server/database';
import { storage } from '$lib/server/storage';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	// Get share link
	const shareLink = database.getShareLink(token);

	if (!shareLink) {
		throw error(404, 'Link not found');
	}

	// Check if link is valid
	if (!database.isLinkValid(shareLink)) {
		throw error(410, 'Link has expired or reached download limit');
	}

	// Get file metadata
	const metadata = await storage.getMetadata(shareLink.fileId);

	if (!metadata) {
		throw error(404, 'File not found');
	}

	return {
		fileName: metadata.originalName,
		fileSize: metadata.size,
		mimeType: metadata.mimeType,
		uploadedAt: metadata.uploadedAt.toISOString(),
		expiresAt: shareLink.expiresAt,
		downloadCount: shareLink.downloadCount,
		maxDownloads: shareLink.maxDownloads,
		token
	};
};
