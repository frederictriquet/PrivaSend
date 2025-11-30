import { randomBytes } from 'crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { config } from './config';

export interface Session {
	id: string;
	createdAt: Date;
	expiresAt: Date;
	isAdmin: boolean;
}

// In-memory session store (simple, no external dependency)
const sessions = new Map<string, Session>();

export class SessionService {
	private static readonly COOKIE_NAME = 'privasend_session';
	private static sessionSecret: string;

	static initialize() {
		// Auto-generate session secret if not configured
		this.sessionSecret = config.auth.sessionSecret || randomBytes(32).toString('hex');
		if (!config.auth.sessionSecret) {
			console.log('Session secret auto-generated');
		}
		console.log('Session service initialized');
	}

	static createSession(): Session {
		const id = randomBytes(32).toString('hex');
		const timeoutHours = config.auth.sessionTimeoutHours;

		const session: Session = {
			id,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + timeoutHours * 60 * 60 * 1000),
			isAdmin: true
		};

		sessions.set(id, session);
		return session;
	}

	static getSession(sessionId: string): Session | null {
		const session = sessions.get(sessionId);
		if (!session) return null;

		// Check expiration
		if (new Date() > session.expiresAt) {
			this.destroySession(sessionId);
			return null;
		}

		return session;
	}

	static destroySession(sessionId: string): void {
		sessions.delete(sessionId);
	}

	static setSessionCookie(event: RequestEvent, sessionId: string): void {
		event.cookies.set(this.COOKIE_NAME, sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: config.auth.sessionTimeoutHours * 60 * 60
		});
	}

	static clearSessionCookie(event: RequestEvent): void {
		event.cookies.delete(this.COOKIE_NAME, { path: '/' });
	}

	static getSessionFromCookie(event: RequestEvent): Session | null {
		const sessionId = event.cookies.get(this.COOKIE_NAME);
		if (!sessionId) return null;

		return this.getSession(sessionId);
	}

	// Cleanup expired sessions periodically
	static startCleanup(): void {
		setInterval(
			() => {
				const now = new Date();
				for (const [id, session] of sessions.entries()) {
					if (now > session.expiresAt) {
						sessions.delete(id);
					}
				}
			},
			60 * 60 * 1000
		); // Every hour
	}

	// Get session count for monitoring
	static getSessionCount(): number {
		return sessions.size;
	}
}

// Initialize on module load
SessionService.initialize();
SessionService.startCleanup();
