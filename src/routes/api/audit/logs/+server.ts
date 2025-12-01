import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuditService } from '$lib/server/audit';

/**
 * Get audit logs
 * GET /api/audit/logs?type=authentication&limit=100
 */
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
