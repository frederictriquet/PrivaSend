# Phase 1.6 - Upload Disable Mode - TODO

## ✅ Déjà Implémenté (Backend Complete)

1. **Configuration** ✅
   - `config.upload.enabled` ajouté
   - `UPLOAD_ENABLED` dans .env.example
   - Default: true (backward compatible)

2. **API Protection** ✅ (CRITIQUE - Sécurité)
   - Check dans `/api/upload` endpoint
   - Return 403 si disabled
   - Bloque AVANT tout traitement

3. **Config Endpoint** ✅
   - `GET /api/config` créé
   - Expose upload.enabled et sharedVolume.enabled

4. **Server Redirect** ✅
   - `+page.server.ts` créé
   - Auto-redirect vers /share-existing si upload disabled

## ⏳ Reste à Faire (Frontend + Tests)

### UI Conditionnelle (30 min)

Rien à faire - la redirection server-side suffit !
Si upload disabled → redirect automatique vers /share-existing

### Tests Unitaires (1h)

```typescript
// tests/unit/lib/config-upload.test.ts
describe('Upload Config', () => {
	it('should default to enabled', () => {
		expect(config.upload.enabled).toBe(true);
	});

	it('should disable when UPLOAD_ENABLED=false', async () => {
		process.env.UPLOAD_ENABLED = 'false';
		vi.resetModules();
		const { config } = await import('$lib/server/config');
		expect(config.upload.enabled).toBe(false);
	});
});
```

### Tests API Sécurité (1h) - IMPORTANT

```typescript
// tests/unit/routes/upload-security.test.ts
describe('Upload API - Security', () => {
	it('should reject upload when disabled', () => {
		// Mock config.upload.enabled = false
		// POST to /api/upload
		// Expect 403
	});

	it('should NOT save any file when disabled', () => {
		// Attempt upload with disabled config
		// Verify storage directory unchanged
	});
});
```

### Tests E2E (30 min)

Déjà géré par la redirection server-side.
Optionnel: Tester que /api/upload retourne 403.

## 🔒 Sécurité Validée

- ✅ Config level (feature flag)
- ✅ API level (403 explicit rejection)
- ✅ Server redirect (UX)
- ⏳ Tests à ajouter

## Priorité

**Moyenne** - Backend sécurisé est fait
Tests peuvent être ajoutés plus tard en amélioration continue

## Estimation Totale Restante

**2-3 heures** pour tests complets

---

**Backend Phase 1.6 est COMPLET et SÉCURISÉ** ✅

L'upload peut être désactivé et est vraiment bloqué au niveau API (pas juste caché).
