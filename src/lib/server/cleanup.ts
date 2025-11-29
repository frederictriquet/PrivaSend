import { storage } from './storage';
import { database } from './database';
import { config } from './config';

/**
 * Cleanup service for expired files and links
 */
class CleanupService {
	private intervalId: NodeJS.Timeout | null = null;

	/**
	 * Start automatic cleanup of expired files
	 */
	start() {
		if (this.intervalId) {
			console.log('Cleanup service already running');
			return;
		}

		console.log(
			`Starting cleanup service (interval: ${config.retention.cleanupIntervalHours} hours)`
		);

		// Run immediately on start
		this.runCleanup();

		// Then run periodically
		const intervalMs = config.retention.cleanupIntervalHours * 60 * 60 * 1000;
		this.intervalId = setInterval(() => {
			this.runCleanup();
		}, intervalMs);
	}

	/**
	 * Stop automatic cleanup
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			console.log('Cleanup service stopped');
		}
	}

	/**
	 * Run cleanup once
	 */
	async runCleanup() {
		try {
			console.log('Running cleanup of expired files and links...');

			// Cleanup expired files
			const deletedFiles = await storage.cleanupExpiredFiles();
			console.log(`Cleanup: ${deletedFiles} expired file(s) deleted`);

			// Cleanup expired share links
			const deletedLinks = database.cleanupExpiredLinks();
			console.log(`Cleanup: ${deletedLinks} expired link(s) deleted`);

			console.log(`Cleanup complete: ${deletedFiles} files, ${deletedLinks} links deleted`);
		} catch (error) {
			console.error('Cleanup error:', error);
		}
	}
}

export const cleanupService = new CleanupService();
