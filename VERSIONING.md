# PrivaSend - Versioning Strategy

## Semantic Versioning (SemVer)

PrivaSend utilise [Semantic Versioning 2.0.0](https://semver.org/)

### Format

```
v[MAJOR].[MINOR].[PATCH]
```

Exemples: `v1.0.0`, `v1.2.3`, `v2.0.0`

### Règles

**MAJOR** (breaking changes):

- Changements incompatibles dans l'API
- Modifications du schéma de base de données incompatibles
- Suppression de fonctionnalités
- Changements dans la configuration qui cassent le backward compatibility

**MINOR** (new features):

- Nouvelles fonctionnalités (backward compatible)
- Nouvelles phases du roadmap
- Améliorations de fonctionnalités existantes
- Nouvelles API endpoints

**PATCH** (bug fixes):

- Corrections de bugs
- Patches de sécurité
- Optimisations de performance
- Corrections de documentation

### Pre-releases

Pour les versions en développement:

- `v1.0.0-alpha.1` - Phase alpha
- `v1.0.0-beta.1` - Phase beta
- `v1.0.0-rc.1` - Release candidate

## État Actuel

**Version actuelle**: `v0.4.0` (Pre-release)

- `v0.1.0` - Phase 1.1 (Upload & Storage)
- `v0.2.0` - Phase 1.2 (Links & Download)
- `v0.3.0` - Phase 1.4 (Security Basics)
- `v0.4.0` - Phase 2 (CI/CD & Quality) **← Actuel**

**Prochaine version**: `v1.0.0` (First stable release)

- Sera créée après Phase 3 (Security Avancée)

## Workflow de Release

### 1. Développement

```bash
# Travailler sur une branche
git checkout -b feature/new-feature

# Commits
git commit -m "Add new feature"

# Push et PR
git push origin feature/new-feature
```

### 2. Création de Version

Quand prêt pour une release:

```bash
# 1. Mettre à jour package.json version
npm version minor  # ou major, ou patch

# Cela crée automatiquement:
# - Met à jour package.json
# - Crée un commit "v1.2.0"
# - Crée un tag "v1.2.0"

# 2. Push le tag
git push origin master --tags

# 3. GitHub Actions s'exécute automatiquement
# - Build Docker image
# - Tag avec v1.2.0, v1.2, v1, latest
# - Push vers ghcr.io
# - Crée GitHub Release (si configuré)
```

### 3. Commandes npm version

```bash
# Patch release (0.1.0 → 0.1.1)
npm version patch

# Minor release (0.1.0 → 0.2.0)
npm version minor

# Major release (0.1.0 → 1.0.0)
npm version major

# Pre-release
npm version prerelease --preid=alpha  # 0.1.0 → 0.1.1-alpha.0
npm version prerelease --preid=beta   # 0.1.0 → 0.1.1-beta.0
npm version prerelease --preid=rc     # 0.1.0 → 0.1.1-rc.0

# Version spécifique
npm version 1.0.0
```

### 4. Release Automatique

Le workflow Docker détecte les tags `v*` et:

- Build l'image Docker
- Tag avec multiples versions:
  ```
  ghcr.io/USER/privasend:v1.2.3
  ghcr.io/USER/privasend:v1.2
  ghcr.io/USER/privasend:v1
  ghcr.io/USER/privasend:latest
  ```
- Scan de sécurité
- Upload vers GitHub Container Registry

## Mapping Phase → Version

| Phase     | Version | Description                           |
| --------- | ------- | ------------------------------------- |
| Phase 1.1 | v0.1.0  | MVP Upload & Storage                  |
| Phase 1.2 | v0.2.0  | Links & Download                      |
| Phase 1.4 | v0.3.0  | Security Basics                       |
| Phase 2   | v0.4.0  | CI/CD & Quality                       |
| Phase 3   | v1.0.0  | First Stable (avec auth & encryption) |
| Phase 4   | v1.1.0  | UX Enhancements                       |
| Phase 5   | v1.2.0  | Admin Dashboard                       |
| Phase 6   | v2.0.0  | API (breaking change si besoin)       |
| Phase 7   | v2.x.0  | Advanced Features                     |

## Docker Images

### Tags Disponibles

Après chaque release, plusieurs tags sont créés:

```bash
# Version complète
docker pull ghcr.io/USER/privasend:v1.2.3

# Version majeure.mineure (auto-update patch)
docker pull ghcr.io/USER/privasend:v1.2

# Version majeure (auto-update minor)
docker pull ghcr.io/USER/privasend:v1

# Latest (master branch)
docker pull ghcr.io/USER/privasend:latest

# Commit SHA (pour debug)
docker pull ghcr.io/USER/privasend:master-abc123

# Branch spécifique
docker pull ghcr.io/USER/privasend:develop
```

### Recommandations Production

```yaml
# docker-compose.yml pour production
services:
  privasend:
    # ✅ RECOMMANDÉ: Pin version majeure.mineure
    image: ghcr.io/USER/privasend:v1.2

    # ⚠️ ACCEPTABLE: Version complète (pas d'auto-update)
    # image: ghcr.io/USER/privasend:v1.2.3

    # ❌ NON RECOMMANDÉ: latest (peut casser)
    # image: ghcr.io/USER/privasend:latest
```

## GitHub Releases

### Création Manuelle

```bash
# Via GitHub CLI
gh release create v1.0.0 \
  --title "v1.0.0 - First Stable Release" \
  --notes "See CHANGELOG.md for details"

# Via GitHub UI
# → Releases → Draft new release → Tag v1.0.0
```

### Contenu d'une Release

```markdown
## v1.2.0 - Phase 4 Complete

### ✨ New Features

- Admin dashboard
- User management
- Storage statistics

### 🐛 Bug Fixes

- Fixed upload timeout on slow connections
- Corrected file size display

### 🔒 Security

- Updated dependencies
- Fixed XSS vulnerability

### 📦 Docker

ghcr.io/USER/privasend:v1.2.0

### 📝 Full Changelog

https://github.com/USER/privasend/compare/v1.1.0...v1.2.0
```

## Changelog Automatique

### Option 1: release-please (Google)

`.github/workflows/release-please.yml`:

```yaml
name: Release Please

on:
  push:
    branches: [master]

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        with:
          release-type: node
          package-name: privasend
```

### Option 2: Conventional Commits

Format de commits:

```bash
feat: Add admin dashboard
fix: Correct file upload timeout
docs: Update README
chore: Update dependencies
security: Patch XSS vulnerability
```

Génération changelog:

```bash
npx conventional-changelog-cli -p angular -i CHANGELOG.md -s
```

### Option 3: Manuel

Maintenir `CHANGELOG.md` manuellement (approche actuelle).

## Version dans le Code

### package.json

```json
{
	"version": "0.4.0"
}
```

Accessible dans le code:

```typescript
import packageJson from '../package.json';
console.log(packageJson.version); // "0.4.0"
```

### Runtime Version Endpoint

Créer un endpoint pour vérifier la version:

**`src/routes/api/version/+server.ts`:**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import packageJson from '../../../../package.json';

export const GET: RequestHandler = async () => {
	return json({
		version: packageJson.version,
		name: packageJson.name,
		nodeVersion: process.version
	});
};
```

Usage:

```bash
curl http://localhost:5173/api/version
# {"version":"0.4.0","name":"privasend","nodeVersion":"v20.10.0"}
```

## Hotfix Strategy

Pour les corrections urgentes en production:

```bash
# 1. Créer branche depuis tag production
git checkout -b hotfix/security-patch v1.2.0

# 2. Fix
git commit -m "security: Fix critical vulnerability"

# 3. Version patch
npm version patch  # v1.2.0 → v1.2.1

# 4. Push
git push origin hotfix/security-patch --tags

# 5. Merge dans master ET develop
git checkout master
git merge hotfix/security-patch
git checkout develop
git merge hotfix/security-patch
```

## Best Practices

### ✅ DO

- Utiliser `npm version` (crée commit + tag)
- Toujours prefix tags avec `v` (v1.0.0)
- Créer CHANGELOG.md détaillé
- Tester avant de tagger
- Pin versions Docker en production (v1.2, pas latest)

### ❌ DON'T

- Ne jamais supprimer ou modifier un tag publié
- Ne pas utiliser `latest` en production
- Ne pas skip des versions
- Ne pas casser SemVer

## Migration Plan

### Actuellement (v0.x.x)

En phase de développement actif, version `0.x.x`:

- Changements rapides acceptables
- Breaking changes OK
- Pas de garantie de stabilité

### Version 1.0.0

Créer v1.0.0 quand:

- ✅ Phase 1 complète (MVP)
- ✅ Phase 2 complète (CI/CD)
- ✅ Phase 3 complète (Security)
- ✅ Documentation complète
- ✅ Tests avec bon coverage
- ✅ Production-ready

**Estimation**: Après Phase 3 (Sécurité Avancée)

### Post-1.0.0

Après v1.0.0:

- Stabilité garantie
- Backward compatibility respectée
- Deprecation warnings avant breaking changes
- Support LTS possible

## Configuration Actuelle

### package.json

Mettre à jour pour refléter Phase 2:

```json
{
	"version": "0.4.0"
}
```

### Git Tags Suggérés

À créer maintenant pour historique:

```bash
# Tag les phases précédentes (optionnel)
git tag v0.1.0 [commit-phase-1.1] -m "Phase 1.1 - Upload & Storage"
git tag v0.2.0 [commit-phase-1.2] -m "Phase 1.2 - Links & Download"
git tag v0.3.0 [commit-phase-1.4] -m "Phase 1.4 - Security Basics"
git tag v0.4.0 -m "Phase 2 - CI/CD & Quality"

# Push tous les tags
git push origin --tags
```

## Automatisation Recommandée

### Script de Release

Créer `scripts/release.sh`:

```bash
#!/bin/bash
set -e

# Get new version
NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: ./scripts/release.sh [major|minor|patch|version]"
  exit 1
fi

# Check clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory not clean"
  exit 1
fi

# Update version
npm version $NEW_VERSION

# Get the new version number
VERSION=$(node -p "require('./package.json').version")

# Push
git push origin master --tags

echo "✅ Released v$VERSION"
echo "🐳 Docker image will be built automatically"
echo "📦 Check: https://github.com/USER/privasend/actions"
```

Usage:

```bash
chmod +x scripts/release.sh
./scripts/release.sh minor  # 0.4.0 → 0.5.0
```

## Résumé

**Versioning actuel**: `v0.4.0` (Pre-release)
**Méthode**: Semantic Versioning via Git tags
**Automatisation**: GitHub Actions détecte tags `v*`
**Docker**: Tags multiples automatiques
**Production**: Pin version majeure.mineure (ex: `v1.2`)

Voulez-vous que je crée le script de release et que je mette à jour la version du package.json à `0.4.0` ?
