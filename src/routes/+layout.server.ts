import type { LayoutServerLoad } from './$types';
import { AuthService } from '$lib/server/auth';

export const load: LayoutServerLoad = async () => {
	return {
		authEnabled: AuthService.isEnabled()
	};
};
