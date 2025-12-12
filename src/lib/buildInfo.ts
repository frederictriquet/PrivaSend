// Build information
// Version is read from package.json

import pkg from '../../package.json';

export const buildInfo = {
	version: pkg.version,
	buildDate: new Date().toISOString(),
	buildTimestamp: Date.now()
};
