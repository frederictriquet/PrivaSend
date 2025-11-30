# Phase 1.6 - Mode Shared-Only (Désactivation Upload)

**Status**: PLANIFICATION
**Priorité**: Haute (Sécurité)
**Complexité**: Faible

## Vue d'ensemble

Permettre de désactiver complètement la fonctionnalité d'upload pour transformer PrivaSend en un serveur de partage de fichiers **read-only** (partage de fichiers existants uniquement).

## Cas d'Usage

### Scénario 1 : Serveur de Fichiers NAS

```
Entreprise avec NAS contenant documents sensibles
→ Veut partager certains fichiers via liens
→ NE veut PAS accepter d'uploads (sécurité)
→ Mode shared-only activé
```

### Scénario 2 : Distribution de Builds

```
Serveur CI/CD avec artifacts
→ Partage builds via PrivaSend
→ Uploads interdits (sécurité)
→ Seuls les fichiers du CI peuvent être partagés
```

### Scénario 3 : Bibliothèque de Fichiers

```
Serveur avec bibliothèque de fichiers
→ Partage public de certains fichiers
→ Pas d'uploads utilisateurs
→ Contrôle total sur le contenu
```

## Sécurité - Priorité Critique

### Principes de Sécurité

1. **Defense in Depth** : Bloquer à tous les niveaux
2. **Secure by Default** : Si désactivé, vraiment désactivé
3. **Fail Secure** : En cas de doute, refuser
4. **Explicit Deny** : Bloquer explicitement, pas juste cacher UI

### Niveaux de Protection

#### Niveau 1 : Configuration (Défense)

```env
UPLOAD_ENABLED=false
```

#### Niveau 2 : API (Critique - Bloquer Requêtes)

```typescript
// src/routes/api/upload/+server.ts
export const POST: RequestHandler = async () => {
	if (!config.upload.enabled) {
		throw error(403, {
			message: 'Upload is disabled on this server',
			code: 'UPLOAD_DISABLED'
		});
	}
	// ... rest of upload logic
};
```

**IMPORTANT** : Ne pas juste ignorer, mais **rejeter explicitement** avec 403.

#### Niveau 3 : UI (User Experience)

```svelte
{#if config.upload.enabled}
	<div class="upload-section">
		<!-- Upload UI -->
	</div>
{:else}
	<div class="disabled-notice">
		<h2>Upload Disabled</h2>
		<p>This server only shares existing files.</p>
		<a href="/share-existing">Browse Available Files →</a>
	</div>
{/if}
```

#### Niveau 4 : Redirection Automatique

```typescript
// src/routes/+page.server.ts
export const load = async () => {
	if (!config.upload.enabled) {
		throw redirect(302, '/share-existing');
	}
};
```

## Implémentation

### 1. Configuration

**`src/lib/server/config.ts`** :

```typescript
export const config = {
	// ... existing config

	// Upload configuration
	upload: {
		enabled: env.UPLOAD_ENABLED?.toLowerCase() !== 'false' // Default true
	}
} as const;
```

**`.env.example`** :

```env
# Upload Configuration
UPLOAD_ENABLED=true  # Set to false to disable uploads (shared-only mode)
```

### 2. API Protection (CRITIQUE)

**`src/routes/api/upload/+server.ts`** :

```typescript
export const POST: RequestHandler = async (event) => {
	// SECURITY: Block uploads if disabled
	if (!config.upload.enabled) {
		throw error(403, 'Upload is disabled on this server');
	}

	// Rate limiting (existing)
	const rateLimit = checkRateLimit(event, 'upload');
	if (!rateLimit.allowed) {
		throw error(429, 'Too many upload requests');
	}

	// ... rest of existing upload logic
};
```

### 3. UI Conditionnelle

**`src/routes/+page.svelte`** :

```svelte
<script lang="ts">
	import { buildInfo } from '$lib/buildInfo';

	// Load config from server
	let uploadEnabled = $state(true);

	async function checkUploadStatus() {
		try {
			const res = await fetch('/api/config');
			const data = await res.json();
			uploadEnabled = data.upload.enabled;
		} catch {
			uploadEnabled = true; // Fail open for backward compat
		}
	}

	$effect(() => {
		checkUploadStatus();
	});
</script>

<main>
	{#if uploadEnabled}
		<!-- Existing upload UI -->
	{:else}
		<div class="disabled-notice">
			<svg class="icon">...</svg>
			<h2>Upload Disabled</h2>
			<p>This server is configured to share existing files only.</p>
			<a href="/share-existing" class="button"> Browse Available Files → </a>
		</div>
	{/if}
</main>
```

### 4. Endpoint Config

**`src/routes/api/config/+server.ts`** (nouveau) :

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/server/config';

export const GET: RequestHandler = async () => {
	return json({
		upload: {
			enabled: config.upload.enabled
		},
		sharedVolume: {
			enabled: config.sharedVolume.enabled
		}
	});
};
```

### 5. Redirection Automatique

**`src/routes/+page.server.ts`** (nouveau) :

```typescript
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect to share-existing if upload is disabled
	if (!config.upload.enabled && config.sharedVolume.enabled) {
		throw redirect(302, '/share-existing');
	}

	return {
		uploadEnabled: config.upload.enabled
	};
};
```

## Tests de Sécurité

### Tests Unitaires

```typescript
// tests/unit/lib/config-upload.test.ts
describe('Upload Config', () => {
	it('should default to enabled', () => {
		expect(config.upload.enabled).toBe(true);
	});

	it('should disable when UPLOAD_ENABLED=false', () => {
		process.env.UPLOAD_ENABLED = 'false';
		// reload config
		expect(config.upload.enabled).toBe(false);
	});
});
```

### Tests API

```typescript
// tests/unit/routes/upload-disabled.test.ts
describe('Upload API - Disabled', () => {
	it('should reject upload when disabled', async () => {
		process.env.UPLOAD_ENABLED = 'false';

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toContain('Upload is disabled');
	});

	it('should NOT save file when disabled', async () => {
		// Attempt upload with disabled config
		// Verify no file was saved to disk
	});
});
```

### Tests E2E

```typescript
// tests/e2e/upload-disabled.spec.ts
test('should show disabled notice when upload disabled', async ({ page }) => {
	// Set UPLOAD_ENABLED=false in test env
	await page.goto('/');

	await expect(page.locator('.disabled-notice')).toBeVisible();
	await expect(page.locator('.upload-section')).not.toBeVisible();
});

test('should redirect to /share-existing', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL('/share-existing');
});

test('should reject API upload requests', async ({ page }) => {
	const response = await page.request.post('/api/upload', {
		data: {
			/* upload data */
		}
	});

	expect(response.status()).toBe(403);
});
```

## Configuration Docker

### Mode Shared-Only

```yaml
services:
  privasend:
    image: ghcr.io/frederictriquet/privasend:latest
    volumes:
      # Pas de volume storage (upload disabled)
      - /mnt/nas/files:/app/shared:ro # Read-only NAS
    environment:
      # Disable uploads
      - UPLOAD_ENABLED=false

      # Enable shared volume
      - SHARED_VOLUME_ENABLED=true
      - SHARED_VOLUME_PATH=/app/shared
      - SHARED_VOLUME_READ_ONLY=true
```

### Mode Hybride (Default)

```yaml
services:
  privasend:
    volumes:
      - ./storage:/app/storage # Uploads
      - ./shared:/app/shared:ro # Shared files
    environment:
      - UPLOAD_ENABLED=true # Both modes
      - SHARED_VOLUME_ENABLED=true
```

## Messages Utilisateur

### Page d'accueil (upload disabled)

```
┌─────────────────────────────────┐
│         🔒 Upload Disabled      │
│                                 │
│  This server is configured to   │
│  share existing files only.     │
│                                 │
│  No file uploads are accepted.  │
│                                 │
│  [Browse Available Files →]     │
└─────────────────────────────────┘
```

### Réponse API (upload disabled)

```json
{
	"error": "Upload is disabled on this server",
	"code": "UPLOAD_DISABLED",
	"message": "This server only shares existing files. Please contact the administrator.",
	"status": 403
}
```

## Checklist de Sécurité

Avant de considérer la fonctionnalité complète :

- [ ] Config avec UPLOAD_ENABLED
- [ ] API /api/upload vérifie config et rejette (403)
- [ ] API /api/config expose upload.enabled
- [ ] UI cache upload section si disabled
- [ ] Redirection automatique si applicable
- [ ] Tests unitaires (config, API)
- [ ] Tests E2E (rejection, UI)
- [ ] Tests de sécurité (tentative bypass)
- [ ] Documentation complète
- [ ] Exemple docker-compose

## Cas Limites

### Upload Disabled + Shared Volume Disabled

**Comportement** : Page d'accueil montre erreur

```
⚠️ Server Misconfiguration

Both upload and shared volume are disabled.
Please contact the administrator.
```

### Upload Enabled + Shared Volume Disabled

**Comportement** : Mode normal (upload only)

### Upload Disabled + Shared Volume Enabled

**Comportement** : Mode shared-only (redirect to /share-existing)

## Avantages

✅ **Sécurité renforcée** : Contrôle total sur les fichiers
✅ **Use case NAS** : Parfait pour serveurs de fichiers
✅ **Simplicité** : Une seule variable d'env
✅ **Flexibility** : Peut changer sans rebuild
✅ **Protection multi-niveaux** : UI + API + Config

## Estimation

- Config : 30 min
- API protection : 1h
- UI conditionnelle : 1h
- Tests : 2h
- Documentation : 30 min

**Total** : 5 heures

## Priorité

**Haute** - Sécurité critique pour cas d'usage enterprise/NAS

Implémenter **avant** mise en production pour serveurs de fichiers sensibles.

---

**Note** : Cette fonctionnalité complète la vision de PrivaSend comme solution flexible : Upload-only, Shared-only, ou Hybride.
