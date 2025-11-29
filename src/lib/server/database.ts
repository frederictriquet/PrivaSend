import Database from 'better-sqlite3';
import path from 'path';
import { config } from './config';
import fs from 'fs';

export interface ShareLink {
	id: number;
	token: string;
	fileId: string;
	expiresAt: string; // ISO date string
	createdAt: string; // ISO date string
	downloadCount: number;
	maxDownloads: number | null; // null = unlimited
	passwordHash: string | null; // bcrypt hash, null = no password
	pin: string | null; // 6-digit PIN (hashed), null = no PIN
	allowedIps: string | null; // Comma-separated IPs, null = all IPs allowed
}

class DatabaseService {
	private db: Database.Database | null = null;

	/**
	 * Initialize database connection and schema
	 */
	initialize(): Database.Database {
		if (this.db) return this.db;

		// Ensure storage directory exists
		const dbDir = path.dirname(config.database.path);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		// Open database
		this.db = new Database(config.database.path);

		// Enable WAL mode for better concurrency
		this.db.pragma('journal_mode = WAL');

		// Create tables
		this.createTables();

		return this.db;
	}

	/**
	 * Create database schema
	 */
	private createTables() {
		if (!this.db) throw new Error('Database not initialized');

		this.db.exec(`
			CREATE TABLE IF NOT EXISTS share_links (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				token TEXT NOT NULL UNIQUE,
				fileId TEXT NOT NULL,
				expiresAt TEXT NOT NULL,
				createdAt TEXT NOT NULL,
				downloadCount INTEGER DEFAULT 0,
				maxDownloads INTEGER,
				passwordHash TEXT,
				pin TEXT,
				allowedIps TEXT
			);

			CREATE INDEX IF NOT EXISTS idx_token ON share_links(token);
			CREATE INDEX IF NOT EXISTS idx_fileId ON share_links(fileId);
			CREATE INDEX IF NOT EXISTS idx_expiresAt ON share_links(expiresAt);
		`);
	}

	/**
	 * Get database instance
	 */
	getDb(): Database.Database {
		if (!this.db) {
			return this.initialize();
		}
		return this.db;
	}

	/**
	 * Create a new share link
	 */
	createShareLink(
		token: string,
		fileId: string,
		expiresAt: Date,
		maxDownloads: number | null = null
	): ShareLink {
		const db = this.getDb();

		const stmt = db.prepare(`
			INSERT INTO share_links (token, fileId, expiresAt, createdAt, maxDownloads)
			VALUES (?, ?, ?, ?, ?)
		`);

		const createdAt = new Date().toISOString();
		const result = stmt.run(token, fileId, expiresAt.toISOString(), createdAt, maxDownloads);

		return {
			id: result.lastInsertRowid as number,
			token,
			fileId,
			expiresAt: expiresAt.toISOString(),
			createdAt,
			downloadCount: 0,
			maxDownloads
		};
	}

	/**
	 * Get share link by token
	 */
	getShareLink(token: string): ShareLink | null {
		const db = this.getDb();

		const stmt = db.prepare(`
			SELECT * FROM share_links WHERE token = ?
		`);

		const link = stmt.get(token) as ShareLink | undefined;
		return link || null;
	}

	/**
	 * Get all share links for a file
	 */
	getShareLinksByFileId(fileId: string): ShareLink[] {
		const db = this.getDb();

		const stmt = db.prepare(`
			SELECT * FROM share_links WHERE fileId = ? ORDER BY createdAt DESC
		`);

		return stmt.all(fileId) as ShareLink[];
	}

	/**
	 * Increment download count
	 */
	incrementDownloadCount(token: string): boolean {
		const db = this.getDb();

		const stmt = db.prepare(`
			UPDATE share_links
			SET downloadCount = downloadCount + 1
			WHERE token = ?
		`);

		const result = stmt.run(token);
		return result.changes > 0;
	}

	/**
	 * Check if link is still valid
	 */
	isLinkValid(link: ShareLink): boolean {
		// Check expiration
		const now = new Date();
		const expiresAt = new Date(link.expiresAt);
		if (expiresAt < now) {
			return false;
		}

		// Check download limit
		if (link.maxDownloads !== null && link.downloadCount >= link.maxDownloads) {
			return false;
		}

		return true;
	}

	/**
	 * Delete share link
	 */
	deleteShareLink(token: string): boolean {
		const db = this.getDb();

		const stmt = db.prepare(`
			DELETE FROM share_links WHERE token = ?
		`);

		const result = stmt.run(token);
		return result.changes > 0;
	}

	/**
	 * Delete all share links for a file
	 */
	deleteShareLinksByFileId(fileId: string): number {
		const db = this.getDb();

		const stmt = db.prepare(`
			DELETE FROM share_links WHERE fileId = ?
		`);

		const result = stmt.run(fileId);
		return result.changes;
	}

	/**
	 * Clean up expired links
	 */
	cleanupExpiredLinks(): number {
		const db = this.getDb();

		const stmt = db.prepare(`
			DELETE FROM share_links WHERE expiresAt < ?
		`);

		const result = stmt.run(new Date().toISOString());
		return result.changes;
	}

	/**
	 * Get all share links
	 */
	getAllShareLinks(): ShareLink[] {
		const db = this.getDb();

		const stmt = db.prepare(`
			SELECT * FROM share_links ORDER BY createdAt DESC
		`);

		return stmt.all() as ShareLink[];
	}

	/**
	 * Close database connection
	 */
	close() {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}
}

// Singleton instance
export const database = new DatabaseService();
