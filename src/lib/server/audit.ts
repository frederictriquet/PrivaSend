import { database } from './database';

export interface AuditLog {
	id?: number;
	timestamp: number;
	eventType: string;
	userType: 'admin' | 'public';
	ipAddress: string;
	userAgent?: string;
	resourceType?: 'file' | 'link' | 'session';
	resourceId?: string;
	action: 'create' | 'read' | 'delete' | 'login' | 'logout';
	status: 'success' | 'failure';
	details?: Record<string, unknown>;
	createdAt: number;
}

export class AuditService {
	static log(entry: Omit<AuditLog, 'id' | 'timestamp' | 'createdAt'>): void {
		const now = Date.now();
		const auditLog = {
			...entry,
			timestamp: now,
			createdAt: now,
			details: entry.details ? JSON.stringify(entry.details) : undefined
		};

		database.createAuditLog(auditLog);
	}

	static logAuth(
		action: 'login' | 'logout',
		status: 'success' | 'failure',
		ipAddress: string,
		details?: Record<string, unknown>
	): void {
		this.log({
			eventType: 'authentication',
			userType: 'admin',
			ipAddress,
			action,
			status,
			resourceType: 'session',
			details
		});
	}

	static logUpload(
		action: 'create' | 'delete',
		status: 'success' | 'failure',
		fileId: string,
		ipAddress: string,
		userAgent?: string,
		details?: Record<string, unknown>
	): void {
		this.log({
			eventType: 'upload',
			userType: 'admin',
			ipAddress,
			userAgent,
			resourceType: 'file',
			resourceId: fileId,
			action,
			status,
			details
		});
	}

	static logLinkCreation(
		status: 'success' | 'failure',
		linkToken: string,
		sourceType: 'upload' | 'shared',
		ipAddress: string,
		details?: Record<string, unknown>
	): void {
		this.log({
			eventType: 'link_creation',
			userType: 'admin',
			ipAddress,
			resourceType: 'link',
			resourceId: linkToken,
			action: 'create',
			status,
			details: { ...details, sourceType }
		});
	}

	static logDownload(
		action: 'read',
		status: 'success' | 'failure',
		linkToken: string,
		ipAddress: string,
		userAgent?: string,
		details?: Record<string, unknown>
	): void {
		this.log({
			eventType: 'download',
			userType: 'public',
			ipAddress,
			userAgent,
			resourceType: 'link',
			resourceId: linkToken,
			action,
			status,
			details
		});
	}

	static logBrowse(ipAddress: string, path: string, userAgent?: string): void {
		this.log({
			eventType: 'browse',
			userType: 'admin',
			ipAddress,
			userAgent,
			action: 'read',
			status: 'success',
			details: { path }
		});
	}

	static getRecentLogs(limit: number = 100): unknown[] {
		return database.getRecentAuditLogs(limit);
	}

	static getLogsByEventType(eventType: string, limit: number = 100): unknown[] {
		return database.getAuditLogsByEventType(eventType, limit);
	}

	static getLogsByIp(ipAddress: string, limit: number = 100): unknown[] {
		return database.getAuditLogsByIp(ipAddress, limit);
	}

	static getLogsByResource(resourceType: string, resourceId: string): unknown[] {
		return database.getAuditLogsByResource(resourceType, resourceId);
	}

	static cleanupOldLogs(retentionDays: number): number {
		return database.cleanupOldAuditLogs(retentionDays);
	}
}
