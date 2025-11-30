# Phase 1.7 - Authentification Administrateur

**Status** : 🔜 Spécification
**Priorité** : HAUTE - Sécurité critique
**Estimation** : 1-2 jours (8-16h)

## Objectif

Protéger l'accès aux fonctionnalités d'administration (upload et création de liens) par authentification par mot de passe.

## Cas d'Usage

### Avant (Phase 1.6)

- ✅ N'importe qui peut accéder à `/` et uploader des fichiers
- ✅ N'importe qui peut accéder à `/share-existing` et créer des liens
- ✅ Les téléchargements via liens sont publics (pas d'auth)

### Après (Phase 1.7)

- ✅ Seul l'admin authentifié peut uploader des fichiers
- ✅ Seul l'admin authentifié peut parcourir et partager des fichiers existants
- ✅ Les téléchargements via liens restent publics (pas d'auth requise)
- ✅ Les utilisateurs non authentifiés sont redirigés vers `/login`

## Architecture

### Modèle de Sécurité

```
┌──────────────────────────────────────────────────────────┐
│                    PrivaSend Security                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Admin (authentifié)                                     │
│  ├─ /login              → Login page (public)            │
│  ├─ /                   → Upload UI (protected)          │
│  ├─ /share-existing     → File browser (protected)       │
│  ├─ POST /api/upload    → Upload API (protected)         │
│  ├─ GET /api/shared/*   → Browse API (protected)         │
│  └─ POST /api/shared/*  → Create link API (protected)    │
│                                                           │
│  Public (pas d'auth)                                     │
│  └─ /download/[token]   → Download (public)              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Implémentation

### 1. Configuration (Variables d'Environnement)

**`.env.example`** :

```env
# Authentication (Phase 1.7)
# REQUIRED in production - Password for admin access
ADMIN_PASSWORD=changeme123

# Optional - Secret for signing session cookies (auto-generated if not set)
SESSION_SECRET=

# Optional - Session duration in hours (default: 24)
SESSION_TIMEOUT_HOURS=24

# Optional - Login rate limit (attempts per minute, default: 3)
LOGIN_RATE_LIMIT=3

# Optional - Enable authentication (default: false for backward compatibility)
# Set to true to require login for upload/share operations
AUTH_ENABLED=false
```

**Backward Compatibility** :

- Par défaut, `AUTH_ENABLED=false` → comportement actuel (pas d'auth)
- Si `AUTH_ENABLED=true` ET `ADMIN_PASSWORD` non défini → erreur au démarrage
- Permet une migration progressive sans breaking changes

### 2. Backend - Session Management

**`src/lib/server/session.ts`** (nouveau) :

```typescript
import { randomBytes } from 'crypto';
import type { RequestEvent } from '@sveltejs/kit';

interface Session {
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
		this.sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
		console.log('Session service initialized');
	}

	static createSession(): Session {
		const id = randomBytes(32).toString('hex');
		const timeoutHours = parseInt(process.env.SESSION_TIMEOUT_HOURS || '24');

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
			maxAge: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24') * 60 * 60
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
}

// Initialize on module load
SessionService.initialize();
SessionService.startCleanup();
```

### 3. Backend - Authentication Service

**`src/lib/server/auth.ts`** (nouveau) :

```typescript
import bcrypt from 'bcrypt';
import { config } from './config';

export class AuthService {
	private static passwordHash: string | null = null;

	static async initialize(): Promise<void> {
		if (!config.auth.enabled) {
			console.log('Authentication disabled');
			return;
		}

		if (!config.auth.adminPassword) {
			throw new Error('ADMIN_PASSWORD must be set when AUTH_ENABLED=true');
		}

		// Hash password at startup
		this.passwordHash = await bcrypt.hash(config.auth.adminPassword, 10);
		console.log('Authentication enabled - Admin password configured');
	}

	static async verifyPassword(password: string): Promise<boolean> {
		if (!this.passwordHash) {
			throw new Error('Authentication not initialized');
		}

		return bcrypt.compare(password, this.passwordHash);
	}

	static isEnabled(): boolean {
		return config.auth.enabled;
	}
}
```

### 4. Backend - Middleware

**`src/hooks.server.ts`** (modifier) :

```typescript
import type { Handle } from '@sveltejs/kit';
import { SessionService } from '$lib/server/session';
import { AuthService } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

// Initialize auth on startup
AuthService.initialize();

export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth check if disabled
	if (!AuthService.isEnabled()) {
		return resolve(event);
	}

	// Get session from cookie
	const session = SessionService.getSessionFromCookie(event);

	// Attach session to locals for use in endpoints
	event.locals.session = session;
	event.locals.isAuthenticated = session !== null;

	// Protected routes
	const protectedRoutes = ['/', '/share-existing'];
	const protectedAPIs = ['/api/upload', '/api/shared'];

	// Check if route is protected
	const isProtectedRoute = protectedRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	const isProtectedAPI = protectedAPIs.some((api) => event.url.pathname.startsWith(api));

	// Allow public routes (login, download)
	if (event.url.pathname === '/login' || event.url.pathname.startsWith('/download/')) {
		return resolve(event);
	}

	// Redirect to login if accessing protected route without auth
	if (isProtectedRoute && !session) {
		throw redirect(302, '/login');
	}

	// Return 401 for protected API calls without auth
	if (isProtectedAPI && !session) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return resolve(event);
};
```

**`src/app.d.ts`** (modifier) :

```typescript
declare global {
	namespace App {
		interface Locals {
			session: import('$lib/server/session').Session | null;
			isAuthenticated: boolean;
		}
	}
}

export {};
```

### 5. Backend - API Endpoints

**`src/routes/api/auth/login/+server.ts`** (nouveau) :

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthService } from '$lib/server/auth';
import { SessionService } from '$lib/server/session';
import { checkRateLimit } from '$lib/server/ratelimit';

export const POST: RequestHandler = async (event) => {
	// Rate limiting
	const rateLimit = checkRateLimit(event, 'login');
	if (!rateLimit.allowed) {
		throw error(429, 'Too many login attempts. Please try again later.');
	}

	try {
		const { password } = await event.request.json();

		if (!password) {
			throw error(400, 'Password is required');
		}

		// Verify password
		const isValid = await AuthService.verifyPassword(password);

		if (!isValid) {
			console.log(`Failed login attempt from ${event.getClientAddress()}`);
			throw error(401, 'Invalid password');
		}

		// Create session
		const session = SessionService.createSession();
		SessionService.setSessionCookie(event, session.id);

		console.log(`Successful login from ${event.getClientAddress()}`);

		return json({
			success: true,
			expiresAt: session.expiresAt.toISOString()
		});
	} catch (err) {
		console.error('Login error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Login failed');
	}
};
```

**`src/routes/api/auth/logout/+server.ts`** (nouveau) :

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SessionService } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	const session = SessionService.getSessionFromCookie(event);

	if (session) {
		SessionService.destroySession(session.id);
	}

	SessionService.clearSessionCookie(event);

	return json({ success: true });
};
```

**`src/routes/api/auth/status/+server.ts`** (nouveau) :

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthService } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	return json({
		authEnabled: AuthService.isEnabled(),
		authenticated: event.locals.isAuthenticated || false
	});
};
```

### 6. Frontend - Login Page

**`src/routes/login/+page.svelte`** (nouveau) :

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Login failed');
			}

			// Redirect to home on success
			await goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<main class="login-container">
	<div class="login-card">
		<div class="logo">
			<img src="/logo.png" alt="PrivaSend" />
			<h1>PrivaSend</h1>
		</div>

		<h2>Admin Login</h2>
		<p class="subtitle">Enter your password to access the admin panel</p>

		<form onsubmit={handleLogin}>
			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter admin password"
					required
					disabled={loading}
				/>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<button type="submit" disabled={loading}>
				{loading ? 'Logging in...' : 'Login'}
			</button>
		</form>
	</div>
</main>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.logo img {
		width: 48px;
		height: 48px;
	}

	.logo h1 {
		font-size: 1.5rem;
		margin: 0;
		color: #667eea;
	}

	h2 {
		margin: 0 0 0.5rem 0;
		text-align: center;
	}

	.subtitle {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #5568d3;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
</style>
```

### 7. Frontend - Auth Store

**`src/lib/stores/auth.ts`** (nouveau) :

```typescript
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

interface AuthState {
	isAuthenticated: boolean;
	authEnabled: boolean;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isAuthenticated: false,
		authEnabled: false,
		loading: true
	});

	return {
		subscribe,
		async checkStatus() {
			try {
				const response = await fetch('/api/auth/status');
				const data = await response.json();

				update((state) => ({
					...state,
					isAuthenticated: data.authenticated,
					authEnabled: data.authEnabled,
					loading: false
				}));
			} catch (err) {
				console.error('Failed to check auth status:', err);
				update((state) => ({ ...state, loading: false }));
			}
		},
		async logout() {
			try {
				await fetch('/api/auth/logout', { method: 'POST' });
				set({ isAuthenticated: false, authEnabled: true, loading: false });
				goto('/login');
			} catch (err) {
				console.error('Logout failed:', err);
			}
		}
	};
}

export const auth = createAuthStore();
```

### 8. Frontend - Logout Button

**`src/routes/+layout.svelte`** (modifier) :

```svelte
<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		auth.checkStatus();
	});

	function handleLogout() {
		auth.logout();
	}
</script>

{#if $auth.authEnabled && $auth.isAuthenticated}
	<div class="logout-button">
		<button onclick={handleLogout}>Logout</button>
	</div>
{/if}

{@render children()}

<style>
	.logout-button {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1000;
	}

	button {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	button:hover {
		background: #f5f5f5;
	}
</style>
```

## Tests

### Tests Unitaires

```typescript
// tests/unit/lib/auth.test.ts
describe('AuthService', () => {
	it('should hash and verify password correctly');
	it('should reject incorrect password');
	it('should handle missing password gracefully');
});

// tests/unit/lib/session.test.ts
describe('SessionService', () => {
	it('should create valid session');
	it('should retrieve session by ID');
	it('should expire old sessions');
	it('should destroy session');
});
```

### Tests API

```typescript
// tests/unit/routes/auth.test.ts
describe('Authentication API', () => {
	it('POST /api/auth/login - success');
	it('POST /api/auth/login - invalid password');
	it('POST /api/auth/login - rate limiting');
	it('POST /api/auth/logout - success');
	it('GET /api/auth/status - authenticated');
	it('GET /api/auth/status - not authenticated');
});
```

### Tests E2E

```typescript
// tests/e2e/authentication.spec.ts
describe('Authentication Flow', () => {
	it('should redirect to login when accessing protected route');
	it('should login successfully with correct password');
	it('should reject login with wrong password');
	it('should access admin pages after login');
	it('should logout and redirect to login');
	it('should allow public download without auth');
});
```

## Sécurité

### Checklist

- [ ] Mot de passe hashé avec bcrypt (salt rounds: 10)
- [ ] Session cookies avec httpOnly, secure, sameSite
- [ ] Rate limiting sur endpoint login (3 tentatives/min)
- [ ] Session timeout configurable
- [ ] Logs des tentatives de connexion
- [ ] CSRF protection (SvelteKit intégré)
- [ ] Pas de stockage de mot de passe en clair
- [ ] Session invalidation côté serveur
- [ ] Cleanup automatique des sessions expirées

### Considérations

1. **Session Storage** : In-memory simple (acceptable pour single-instance)
   - Pour multi-instance : utiliser Redis ou session store externe

2. **Password Reset** : Non implémenté dans cette phase
   - Pour production : ajouter mécanisme de reset (email ou CLI)

3. **Multi-Admin** : Non supporté (1 seul mot de passe)
   - Phase future : base de données users avec rôles

## Documentation

### Configuration Exemple

```env
# Enable authentication
AUTH_ENABLED=true

# Set admin password (REQUIRED if AUTH_ENABLED=true)
ADMIN_PASSWORD=MySecurePassword123!

# Optional: Custom session timeout (hours)
SESSION_TIMEOUT_HOURS=24

# Optional: Custom session secret (auto-generated if not set)
SESSION_SECRET=your-random-secret-here
```

### Usage

1. **First Setup** :

   ```bash
   # Set admin password in .env
   echo "AUTH_ENABLED=true" >> .env
   echo "ADMIN_PASSWORD=YourSecurePassword" >> .env
   ```

2. **Login** :
   - Navigate to `/login`
   - Enter admin password
   - Redirected to `/` (upload page)

3. **Logout** :
   - Click "Logout" button (top-right)
   - Redirected to `/login`

## Estimation

- Backend (session + auth) : 4h
- Frontend (login page + store) : 2h
- Middleware + protection : 2h
- Tests : 4h
- Documentation : 2h

**Total** : 14h (~2 jours)

## Priorité

**HAUTE** - Sécurité critique pour déploiement production

Sans cette phase, n'importe qui peut uploader des fichiers ou créer des liens de partage.
