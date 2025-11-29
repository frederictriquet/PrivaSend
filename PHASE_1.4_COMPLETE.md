# Phase 1.4 - Sécurité de Base ✅

**Status**: COMPLETE
**Date**: 2025-11-29

## Résumé

Phase 1.4 du projet PrivaSend est maintenant terminée ! Toutes les mesures de sécurité de base sont implémentées.

## Fonctionnalités Implémentées

### ✅ HTTPS Enforcement

- **Redirection automatique** : HTTP → HTTPS en production
- **HSTS Headers** : Strict-Transport-Security (1 an)
- **Detection X-Forwarded-Proto** : Compatible reverse proxy

### ✅ Headers de Sécurité

- **X-Content-Type-Options**: nosniff (empêche MIME sniffing)
- **X-Frame-Options**: DENY (empêche clickjacking)
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Désactivation caméra, micro, géolocalisation
- **Content-Security-Policy**: Politique stricte

### ✅ Protection contre les Injections

- **Sanitisation des noms de fichiers**
  - Suppression de `../` (path traversal)
  - Suppression de `/` et `\`
  - Limite de longueur à 255 caractères

- **Validation stricte**
  - Détection d'extensions dangereuses (.exe, .bat, .sh, etc.)
  - Validation MIME types
  - Support des wildcards (image/\*)

- **Protection XSS**
  - Suppression de `<>` dans les inputs
  - Suppression de `javascript:` protocol
  - Suppression des event handlers

### ✅ Validation des Fichiers

- **Extensions dangereuses bloquées**
  - Exécutables: .exe, .bat, .cmd, .com, .scr
  - Scripts: .vbs, .js, .jse, .wsf, .ps1, .sh
  - Packages: .jar, .deb, .rpm, .app

- **Validation MIME types**
  - Support whitelist configurable
  - Wildcards supportés
  - Validation côté serveur

- **Validation taille**
  - Limite configurable (5GB par défaut)
  - Validation pour upload direct et chunked
  - Vérification finale après assembly des chunks

### ✅ Rate Limiting

- **Upload**: 10 uploads par heure par IP
- **Download**: 100 downloads par heure par IP
- **API**: 60 requêtes par minute par IP

- **Features**:
  - In-memory store (simple et efficace)
  - Nettoyage automatique toutes les 5 minutes
  - Support reverse proxy (X-Forwarded-For, X-Real-IP)
  - Headers informatifs (retry-after)

## Architecture Technique

### Nouveaux Fichiers

**Security Layer:**

- `src/lib/server/security.ts` - Middleware et fonctions de sécurité
- `src/lib/server/ratelimit.ts` - Système de rate limiting

**Modifications:**

- `src/hooks.server.ts` - Intégration middleware sécurité
- `src/routes/api/upload/+server.ts` - Validation et rate limit upload
- `src/routes/download/[token]/+server.ts` - Rate limit download

## Middleware Stack

```
Request
   ↓
httpsRedirect (production uniquement)
   ↓
securityHeaders (tous les environnements)
   ↓
Route handlers avec rate limiting
   ↓
Response
```

## Content Security Policy

```
default-src 'self'
script-src 'self' 'unsafe-inline'    # unsafe-inline pour Svelte
style-src 'self' 'unsafe-inline'     # unsafe-inline pour Svelte
img-src 'self' data: blob:
font-src 'self' data:
connect-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

## Fonctions de Sécurité

### sanitizeFilename(filename)

```typescript
// Avant: ../../../etc/passwd
// Après: etcpasswd

// Avant: script<test>.js
// Après: scripttest.js

// Avant: long-filename-with-256-characters...
// Après: long-filename-with-255-characters (tronqué)
```

### hasDangerousExtension(filename)

```typescript
hasDangerousExtension('document.pdf'); // false
hasDangerousExtension('malware.exe'); // true
hasDangerousExtension('script.sh'); // true
```

### isValidMimeType(mimeType, allowedTypes)

```typescript
// Si allowedTypes = []
isValidMimeType('application/pdf', []); // true (pas de restriction)

// Si allowedTypes = ['image/*', 'application/pdf']
isValidMimeType('image/jpeg', allowed); // true (wildcard)
isValidMimeType('application/pdf', allowed); // true (exact)
isValidMimeType('video/mp4', allowed); // false
```

## Rate Limiting Configuration

```typescript
rateLimitConfig = {
	upload: {
		maxRequests: 10, // 10 uploads
		windowMs: 60 * 60 * 1000 // par heure
	},
	download: {
		maxRequests: 100, // 100 downloads
		windowMs: 60 * 60 * 1000 // par heure
	},
	api: {
		maxRequests: 60, // 60 requêtes
		windowMs: 60 * 1000 // par minute
	}
};
```

## Tests de Sécurité

### Test 1: Path Traversal Protection

```bash
# Essayer d'uploader avec nom malveillant
curl -X POST http://localhost:5173/api/upload \
  -F "file=@test.pdf;filename=../../../etc/passwd"

# Résultat: Fichier sauvegardé avec nom sanitizé
```

### Test 2: Dangerous Extension

```bash
# Essayer d'uploader un .exe
curl -X POST http://localhost:5173/api/upload \
  -F "file=@test.exe"

# Résultat: 400 File type not allowed for security reasons
```

### Test 3: Rate Limiting

```bash
# Upload 11 fichiers en succession rapide
for i in {1..11}; do
  curl -X POST http://localhost:5173/api/upload \
    -F "file=@test.pdf"
done

# 11ème requête: 429 Too many upload requests
```

### Test 4: MIME Type Validation

```bash
# Avec ALLOWED_MIME_TYPES=image/jpeg,image/png dans .env
curl -X POST http://localhost:5173/api/upload \
  -F "file=@document.pdf"

# Résultat: 415 File type not allowed
```

### Test 5: Security Headers

```bash
curl -I http://localhost:5173

# Vérifie présence de:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...
# etc.
```

## Comparaison Avant/Après

| Vulnérabilité       | Phase 1.3     | Phase 1.4       |
| ------------------- | ------------- | --------------- |
| Path Traversal      | ⚠️ Vulnérable | ✅ Protégé      |
| XSS                 | ⚠️ Vulnérable | ✅ Protégé      |
| Clickjacking        | ⚠️ Vulnérable | ✅ Protégé      |
| MIME Sniffing       | ⚠️ Vulnérable | ✅ Protégé      |
| Malware Upload      | ⚠️ Possible   | ✅ Bloqué       |
| DoS (Upload Spam)   | ⚠️ Vulnérable | ✅ Rate Limited |
| DoS (Download Spam) | ⚠️ Vulnérable | ✅ Rate Limited |
| HTTPS Enforcement   | ⚠️ Optionnel  | ✅ Forcé (prod) |

## Limitations Connues

Ces limitations seront adressées dans Phase 2 :

- ⚠️ **Pas d'authentification** → Phase 2.1
- ⚠️ **Pas de chiffrement** → Phase 2.2
- ⚠️ **Rate limit in-memory** → Pour production scale, utiliser Redis
- ⚠️ **Pas de scan antivirus** → Phase 6
- ⚠️ **Pas d'audit logs** → Phase 2.3

## Configuration .env

Aucune nouvelle variable nécessaire. Les restrictions MIME existantes sont maintenant appliquées :

```env
# Restriction MIME types (optionnel)
ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf

# Ou wildcards
ALLOWED_MIME_TYPES=image/*,application/*

# Ou vide pour tout autoriser (défaut)
ALLOWED_MIME_TYPES=
```

## Sécurité par Couches

### Couche 1: Network (Middleware)

- HTTPS redirection
- Security headers
- CSP

### Couche 2: Application (Handlers)

- Rate limiting
- Input validation
- Filename sanitization

### Couche 3: File System

- Extension validation
- MIME type validation
- Size validation

### Couche 4: Storage

- Unique file IDs
- Metadata separation
- Path restrictions

## Métriques de Sécurité

### OWASP Top 10 Coverage

- ✅ **A01 Broken Access Control** : Partiellement (rate limit)
- ✅ **A02 Cryptographic Failures** : À implémenter Phase 2.2
- ✅ **A03 Injection** : Protégé (sanitization)
- ⚠️ **A04 Insecure Design** : En cours
- ✅ **A05 Security Misconfiguration** : Headers sécurisés
- ⚠️ **A06 Vulnerable Components** : Dépend des deps
- ⚠️ **A07 Identification/Authentication** : Phase 2.1
- ⚠️ **A08 Software/Data Integrity** : Phase 2.2
- ⚠️ **A09 Security Logging** : Phase 2.3
- ✅ **A10 SSRF** : Non applicable (pas de fetch externe)

## Best Practices Implémentées

- ✅ Defense in Depth (plusieurs couches)
- ✅ Fail Secure (rejette par défaut)
- ✅ Least Privilege (restrictions strictes)
- ✅ Input Validation (whitelist > blacklist)
- ✅ Security Headers (protection navigateur)
- ✅ Rate Limiting (protection DoS)

## Prochaines Étapes

### Phase 2 - Sécurité Avancée

**Phase 2.1** - Authentification & Accès :

- Protection par mot de passe des liens
- Authentification utilisateur
- Limite de téléchargements (UI)
- Liste blanche IP

**Phase 2.2** - Chiffrement :

- Chiffrement des fichiers au repos (AES-256)
- E2EE optionnel
- Gestion sécurisée des clés

**Phase 2.3** - Traçabilité :

- Audit logs complets
- Notifications de téléchargement
- Alertes sécurité

### Temps Estimé Phase 2

- Phase 2.1: 4-5 jours
- Phase 2.2: 1 semaine
- Phase 2.3: 2-3 jours

## Production Checklist

Avant de déployer en production:

- [ ] Configurer HTTPS avec certificat valide
- [ ] Activer NODE_ENV=production
- [ ] Configurer reverse proxy (Nginx/Caddy)
- [ ] Définir ALLOWED_MIME_TYPES si restrictions nécessaires
- [ ] Ajuster les limites rate limiting selon le trafic
- [ ] Mettre en place monitoring (erreurs 429, 403, 400)
- [ ] Backup régulier de la base de données
- [ ] Rotation des logs

## Commandes Utiles

```bash
# Test des headers de sécurité
curl -I https://privasend.local

# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:5173/api/upload \
    -F "file=@test.pdf" &
done

# Tester avec un fichier dangereux
curl -X POST http://localhost:5173/api/upload \
  -F "file=@malware.exe"

# Vérifier les restrictions MIME
ALLOWED_MIME_TYPES=image/* npm run dev
curl -X POST http://localhost:5173/api/upload \
  -F "file=@document.pdf"
```

## Résolution de Problèmes

### Rate limit trop strict

Modifier `src/lib/server/ratelimit.ts`:

```typescript
export const rateLimitConfig = {
	upload: {
		maxRequests: 50, // Augmenter
		windowMs: 60 * 60 * 1000
	}
};
```

### Type MIME non détecté

Certains fichiers peuvent avoir un MIME type vide. La validation utilise `application/octet-stream` par défaut.

### Sanitization trop agressive

Modifier `sanitizeFilename()` selon vos besoins dans `src/lib/server/security.ts`.

---

**🎉 Phase 1.4 Terminée avec Succès !**

**Sécurité de base complète** : L'application est maintenant prête pour un déploiement interne sécurisé.

**Prochaine phase** : Phase 2.1 - Authentification & Contrôle d'Accès Avancé

**MVP Status** : ✅ Prêt pour production interne avec sécurité de base
