import { env } from '$env/dynamic/private';
import path from 'path';

export const config = {
	// Storage configuration
	storage: {
		path: env.STORAGE_PATH || path.join(process.cwd(), 'storage'),
		maxFileSize: parseInt(env.MAX_FILE_SIZE || '5368709120'), // 5GB default
		chunkSize: parseInt(env.CHUNK_SIZE || '5242880'), // 5MB chunks
		allowedMimeTypes: env.ALLOWED_MIME_TYPES?.split(',').filter(Boolean) || [] // Empty = allow all
	},

	// Database configuration
	database: {
		path: env.DATABASE_PATH || path.join(process.cwd(), 'storage', 'privasend.db')
	},

	// File retention configuration
	retention: {
		defaultExpirationDays: parseInt(env.DEFAULT_EXPIRATION_DAYS || '7'),
		cleanupIntervalHours: parseInt(env.CLEANUP_INTERVAL_HOURS || '1')
	},

	// Share link configuration
	links: {
		defaultExpirationDays: parseInt(env.LINK_EXPIRATION_DAYS || '7'),
		tokenLength: 32 // Length of share tokens
	},

	// Upload configuration (Phase 1.6)
	upload: {
		enabled: env.UPLOAD_ENABLED?.toLowerCase() !== 'false' // Default true
	},

	// Shared volume configuration (for sharing files already on server)
	sharedVolume: {
		enabled: env.SHARED_VOLUME_ENABLED?.toLowerCase() === 'true' || false,
		path: env.SHARED_VOLUME_PATH || path.join(process.cwd(), 'shared'),
		readOnly: env.SHARED_VOLUME_READ_ONLY?.toLowerCase() !== 'false', // Default true
		maxDepth: parseInt(env.SHARED_VOLUME_MAX_DEPTH || '10')
	},

	// Authentication configuration (Phase 1.7)
	auth: {
		enabled: env.AUTH_ENABLED?.toLowerCase() === 'true' || false, // Default false for backward compat
		adminPassword: env.ADMIN_PASSWORD || '',
		sessionSecret: env.SESSION_SECRET || '', // Auto-generated if empty
		sessionTimeoutHours: parseInt(env.SESSION_TIMEOUT_HOURS || '24'),
		loginRateLimit: parseInt(env.LOGIN_RATE_LIMIT || '3') // attempts per minute
	}
} as const;

export type Config = typeof config;
