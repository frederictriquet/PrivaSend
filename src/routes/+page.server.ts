import { config } from '$lib/server/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		uploadEnabled: config.upload.enabled,
		sharedVolumeEnabled: config.sharedVolume.enabled
	};
};
