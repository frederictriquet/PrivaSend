# Phase 3 - Audit & Traçabilité

**Status** : 🔜 Spécification
**Priorité** : Moyenne
**Estimation** : 3-4 jours

## Objectif

Implémenter un système complet d'audit et de traçabilité pour suivre toutes les opérations importantes dans PrivaSend.

## Cas d'Usage

### Admin

- Voir qui a téléchargé quels fichiers
- Voir toutes les tentatives de connexion
- Voir les fichiers uploadés et par qui
- Voir les liens créés et leur utilisation
- Détecter activités suspectes

### Compliance

- Traçabilité complète des accès
- Logs immuables pour audit
- Rétention configurable
- Export des logs

## Architecture

### Base de Données - Nouvelle Table `audit_logs`

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  user_type TEXT NOT NULL,  -- 'admin' | 'public'
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  resource_type TEXT,  -- 'file' | 'link' | 'session'
  resource_id TEXT,
  action TEXT NOT NULL,  -- 'create' | 'read' | 'delete' | 'login' | 'logout'
  status TEXT NOT NULL,  -- 'success' | 'failure'
  details TEXT,  -- JSON with additional info
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_ip ON audit_logs(ip_address);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
```

## Événements à Logger

### 1. Authentification

- ✅ Login success (déjà loggé dans auth.ts)
- ✅ Login failure (déjà loggé dans auth.ts)
- ✅ Logout (déjà loggé dans logout endpoint)
- Session expiration

### 2. Upload

- File upload started
- File upload success
- File upload failure
- File deleted (cleanup)

### 3. Liens

- Share link created (upload mode)
- Share link created (shared volume mode)
- Share link accessed

### 4. Downloads

- Download started
- Download completed
- Download failed
- Range request (partial download)

### 5. Shared Volume

- Directory browsed
- File selected for sharing

## Implémentation

### 1. Service d'Audit

**`src/lib/server/audit.ts`** :

```typescript
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
	details?: Record<string, any>;
	createdAt: number;
}

export class AuditService {
	static log(entry: Omit<AuditLog, 'id' | 'timestamp' | 'createdAt'>): void {
		const now = Date.now();
		const auditLog: AuditLog = {
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
		details?: Record<string, any>
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
		details?: Record<string, any>
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
		details?: Record<string, any>
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
		details?: Record<string, any>
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

	static getRecentLogs(limit: number = 100): AuditLog[] {
		return database.getRecentAuditLogs(limit);
	}

	static getLogsByEventType(eventType: string, limit: number = 100): AuditLog[] {
		return database.getAuditLogsByEventType(eventType, limit);
	}

	static getLogsByIp(ipAddress: string, limit: number = 100): AuditLog[] {
		return database.getAuditLogsByIp(ipAddress, limit);
	}

	static getLogsByResource(resourceType: string, resourceId: string): AuditLog[] {
		return database.getAuditLogsByResource(resourceType, resourceId);
	}
}
```

### 2. Extension Database

**`src/lib/server/database.ts`** (ajouter) :

```typescript
// Add to DatabaseService class

createAuditLog(log: AuditLog): void {
	const stmt = this.db.prepare(`
		INSERT INTO audit_logs (
			timestamp, event_type, user_type, ip_address, user_agent,
			resource_type, resource_id, action, status, details, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		log.timestamp,
		log.eventType,
		log.userType,
		log.ipAddress,
		log.userAgent || null,
		log.resourceType || null,
		log.resourceId || null,
		log.action,
		log.status,
		log.details || null,
		log.createdAt
	);
}

getRecentAuditLogs(limit: number): AuditLog[] {
	const stmt = this.db.prepare(`
		SELECT * FROM audit_logs
		ORDER BY timestamp DESC
		LIMIT ?
	`);
	return stmt.all(limit) as AuditLog[];
}

getAuditLogsByEventType(eventType: string, limit: number): AuditLog[] {
	const stmt = this.db.prepare(`
		SELECT * FROM audit_logs
		WHERE event_type = ?
		ORDER BY timestamp DESC
		LIMIT ?
	`);
	return stmt.all(eventType, limit) as AuditLog[];
}

getAuditLogsByIp(ipAddress: string, limit: number): AuditLog[] {
	const stmt = this.db.prepare(`
		SELECT * FROM audit_logs
		WHERE ip_address = ?
		ORDER BY timestamp DESC
		LIMIT ?
	`);
	return stmt.all(ipAddress, limit) as AuditLog[];
}

getAuditLogsByResource(resourceType: string, resourceId: string): AuditLog[] {
	const stmt = this.db.prepare(`
		SELECT * FROM audit_logs
		WHERE resource_type = ? AND resource_id = ?
		ORDER BY timestamp DESC
	`);
	return stmt.all(resourceType, resourceId) as AuditLog[];
}

// Cleanup old audit logs (RGPD compliance)
cleanupOldAuditLogs(retentionDays: number): number {
	const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
	const stmt = this.db.prepare(`
		DELETE FROM audit_logs
		WHERE timestamp < ?
	`);
	const result = stmt.run(cutoff);
	return result.changes;
}
```

### 3. Intégration dans les Endpoints

**Modifier les endpoints existants pour logger** :

```typescript
// src/routes/api/upload/+server.ts
import { AuditService } from '$lib/server/audit';

// Après upload success:
AuditService.logUpload(
	'create',
	'success',
	metadata.id,
	event.getClientAddress(),
	event.request.headers.get('user-agent') || undefined,
	{ fileName: metadata.originalName, fileSize: metadata.size }
);

// src/routes/api/auth/login/+server.ts
// Déjà loggé avec console.log, remplacer par AuditService

// src/routes/download/[token]/+server.ts
AuditService.logDownload(
	'read',
	'success',
	token,
	event.getClientAddress(),
	event.request.headers.get('user-agent') || undefined,
	{ fileName: metadata.originalName }
);
```

### 4. API Endpoints Audit

**`src/routes/api/audit/logs/+server.ts`** :

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuditService } from '$lib/server/audit';

export const GET: RequestHandler = async (event) => {
	// Require admin authentication
	if (!event.locals.isAuthenticated) {
		throw error(401, 'Unauthorized');
	}

	const url = event.url;
	const eventType = url.searchParams.get('type');
	const ip = url.searchParams.get('ip');
	const limit = parseInt(url.searchParams.get('limit') || '100');

	let logs;
	if (eventType) {
		logs = AuditService.getLogsByEventType(eventType, limit);
	} else if (ip) {
		logs = AuditService.getLogsByIp(ip, limit);
	} else {
		logs = AuditService.getRecentLogs(limit);
	}

	return json({ logs });
};
```

### 5. UI - Page Audit Logs

**`src/routes/audit/+page.svelte`** :

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	interface AuditLog {
		id: number;
		timestamp: number;
		eventType: string;
		userType: string;
		ipAddress: string;
		action: string;
		status: string;
		resourceType?: string;
		resourceId?: string;
	}

	let logs = $state<AuditLog[]>([]);
	let loading = $state(true);
	let filter = $state('all');

	onMount(async () => {
		await loadLogs();
	});

	async function loadLogs() {
		loading = true;
		try {
			const params = filter !== 'all' ? `?type=${filter}` : '';
			const response = await fetch(`/api/audit/logs${params}`);
			const data = await response.json();
			logs = data.logs;
		} catch (err) {
			console.error('Failed to load audit logs:', err);
		} finally {
			loading = false;
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	function getEventBadgeClass(eventType: string): string {
		const classes: Record<string, string> = {
			authentication: 'badge-blue',
			upload: 'badge-green',
			download: 'badge-purple',
			link_creation: 'badge-orange',
			browse: 'badge-gray'
		};
		return classes[eventType] || 'badge-gray';
	}

	function getStatusClass(status: string): string {
		return status === 'success' ? 'status-success' : 'status-failure';
	}
</script>

<svelte:head>
	<title>Audit Logs - PrivaSend</title>
</svelte:head>

<main>
	<div class="container">
		<header>
			<h1>Audit Logs</h1>
			<p class="subtitle">Activity tracking and security monitoring</p>
		</header>

		<div class="filters">
			<select bind:value={filter} onchange={loadLogs}>
				<option value="all">All Events</option>
				<option value="authentication">Authentication</option>
				<option value="upload">Uploads</option>
				<option value="download">Downloads</option>
				<option value="link_creation">Link Creation</option>
				<option value="browse">Browse</option>
			</select>
			<button onclick={loadLogs}>Refresh</button>
		</div>

		{#if loading}
			<p>Loading logs...</p>
		{:else if logs.length === 0}
			<p>No audit logs found.</p>
		{:else}
			<div class="logs-table">
				<table>
					<thead>
						<tr>
							<th>Time</th>
							<th>Event</th>
							<th>User</th>
							<th>IP</th>
							<th>Action</th>
							<th>Resource</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each logs as log}
							<tr>
								<td>{formatDate(log.timestamp)}</td>
								<td>
									<span class="badge {getEventBadgeClass(log.eventType)}">
										{log.eventType}
									</span>
								</td>
								<td>{log.userType}</td>
								<td class="mono">{log.ipAddress}</td>
								<td>{log.action}</td>
								<td class="mono">
									{#if log.resourceType && log.resourceId}
										{log.resourceType}: {log.resourceId.substring(0, 8)}...
									{:else}
										-
									{/if}
								</td>
								<td>
									<span class="status {getStatusClass(log.status)}">
										{log.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</main>

<style>
	/* Styles similaires aux autres pages */
</style>
```

## Configuration

```env
# Audit Configuration (Phase 3)
AUDIT_ENABLED=true
AUDIT_RETENTION_DAYS=90  # Keep logs for 90 days
```

## Endpoints API

- `GET /api/audit/logs` - Get audit logs (admin only)
  - Query params: `?type=authentication&limit=100`
- `GET /api/audit/stats` - Get audit statistics (admin only)
- `DELETE /api/audit/logs` - Cleanup old logs (admin only)

## Tests

### Unitaires

- Test AuditService.log()
- Test database audit queries
- Test log filtering

### E2E

- Test audit log création
- Test audit viewer UI
- Test admin-only access

## Sécurité

- Logs immuables (INSERT only, no UPDATE)
- Admin-only access
- Rétention configurable (RGPD)
- IP anonymization optionnelle

## Estimation

- Database schema : 1h
- AuditService : 2h
- Integration logging : 3h
- API endpoints : 2h
- UI audit viewer : 4h
- Tests : 3h
  **Total** : ~15h (2 jours)
