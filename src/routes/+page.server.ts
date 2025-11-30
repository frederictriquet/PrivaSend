import { redirect } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect to share-existing if upload is disabled and shared volume is enabled
	if (!config.upload.enabled && config.sharedVolume.enabled) {
		throw redirect(302, '/share-existing');
	}

	return {
		uploadEnabled: config.upload.enabled,
		sharedVolumeEnabled: config.sharedVolume.enabled
	};
};
