# Contributing to PrivaSend

Merci de contribuer à PrivaSend ! Ce guide vous aidera à démarrer.

## Workflow de Développement

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR-USERNAME/privasend.git
cd privasend
```

### 2. Setup

```bash
# Node.js 20 requis
nvm use 20

# Install
npm install

# Configure
cp .env.example .env

# Run
npm run dev
```

### 3. Créer une Branche

```bash
git checkout -b feature/my-new-feature
# ou
git checkout -b fix/bug-description
```

### 4. Développer

- Écrire le code
- Ajouter des tests si applicable
- Formater et linter

```bash
npm run format
npm run lint:fix
npm run check
npm run test
```

### 5. Commit

Utiliser **Conventional Commits** :

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat: Add password protection for links"
git commit -m "fix: Correct file upload timeout"
git commit -m "docs: Update installation guide"
```

#### Types de Commits

- `feat:` - Nouvelle fonctionnalité (MINOR version bump)
- `fix:` - Correction de bug (PATCH version bump)
- `docs:` - Documentation seulement
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Refactoring de code
- `perf:` - Amélioration de performance
- `test:` - Ajout ou correction de tests
- `chore:` - Maintenance, dependencies
- `ci:` - Changements CI/CD
- `security:` - Patches de sécurité

#### Breaking Changes

Pour un breaking change (MAJOR version bump):

```bash
git commit -m "feat!: Change API response format"

# Ou avec body
git commit -m "feat: New authentication system

BREAKING CHANGE: Old auth tokens are no longer valid"
```

#### Scopes (optionnel)

```bash
git commit -m "feat(upload): Add multi-file support"
git commit -m "fix(download): Handle network errors"
git commit -m "docs(readme): Add installation instructions"
```

### 6. Push & Pull Request

```bash
git push origin feature/my-new-feature
```

Créer une PR sur GitHub vers `master`.

### 7. PR Review

La PR déclenchera automatiquement:

- ✅ Lint check
- ✅ Type check
- ✅ Tests (unit + E2E)
- ✅ Build
- ✅ Security scans

Tous les checks doivent passer avant merge.

## Code Quality

### Avant de Commit

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Type check
npm run check

# Run tests
npm run test
```

### Pre-commit Hook (optionnel)

Installer husky pour automatiser:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

`.husky/pre-commit`:

```bash
#!/bin/sh
npm run lint-staged
```

`package.json`:

```json
{
	"lint-staged": {
		"*.{js,ts,svelte}": ["eslint --fix", "prettier --write"],
		"*.{json,md,yml,yaml}": ["prettier --write"]
	}
}
```

## Tests

### Écrire des Tests

**Tests unitaires** (Vitest):

```typescript
// tests/unit/lib/security.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '$lib/server/security';

describe('sanitizeFilename', () => {
	it('should remove path traversal', () => {
		expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
	});

	it('should handle normal filenames', () => {
		expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
	});
});
```

**Tests E2E** (Playwright):

```typescript
// tests/e2e/upload.spec.ts
import { test, expect } from '@playwright/test';

test('should upload file successfully', async ({ page }) => {
	await page.goto('/');

	// Upload file
	const fileInput = page.locator('input[type="file"]');
	await fileInput.setInputFiles('./test-fixtures/test.pdf');

	// Check success message
	await expect(page.locator('text=File uploaded successfully')).toBeVisible();
});
```

### Lancer les Tests

```bash
# Unit tests
npm run test

# Unit tests avec coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Tous les tests
npm run test && npm run test:e2e
```

## Versioning & Releases

### Conventional Commits → Automatic Releases

Le projet utilise **release-please** pour automatiser les releases.

#### Comment ça marche

1. **Vous committez** avec Conventional Commits
2. **Release-please** surveille les commits sur master
3. **PR automatique** créée avec:
   - Version bump (selon les commits)
   - CHANGELOG mis à jour
   - package.json mis à jour
4. **Vous reviewez** et mergez la PR
5. **Release créée** automatiquement avec tag et GitHub Release

#### Types de Version Bump

```bash
# PATCH (0.4.0 → 0.4.1)
fix: Correct upload bug
chore: Update dependencies

# MINOR (0.4.0 → 0.5.0)
feat: Add new download statistics

# MAJOR (0.4.0 → 1.0.0)
feat!: Change database schema
fix!: Remove deprecated API

# Ou avec BREAKING CHANGE dans le body
feat: New authentication

BREAKING CHANGE: Old tokens invalid
```

#### Exemple de Workflow

```bash
# Jour 1-5: Développement
git commit -m "feat: Add admin dashboard"
git commit -m "feat: Add user management"
git commit -m "fix: Correct storage calculation"
git push origin master

# GitHub Actions:
# → Release-please crée PR "chore: release 0.5.0"

# Jour 6: Review
# → Review PR de release
# → Vérifier CHANGELOG.md
# → Merge PR

# Automatiquement:
# → Tag v0.5.0 créé
# → GitHub Release créée
# → Docker workflow triggered
# → Image ghcr.io/.../privasend:v0.5.0 publiée
```

### Release Manuelle (Backup)

Si besoin de release manuelle:

```bash
./scripts/release.sh minor
git push origin master --tags
```

## Structure du Projet

```
PrivaSend/
├── src/
│   ├── lib/server/        # Backend services
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── storage.ts
│   │   ├── security.ts
│   │   ├── ratelimit.ts
│   │   └── cleanup.ts
│   └── routes/            # Pages & API
│       ├── +page.svelte
│       ├── api/
│       │   ├── upload/
│       │   ├── links/
│       │   └── version/
│       └── download/[token]/
├── tests/
│   ├── unit/              # Tests unitaires
│   └── e2e/               # Tests Playwright
├── .github/workflows/     # CI/CD
└── Documentation
```

## Documentation

Avant de contribuer, lire:

- [README.md](README.md) - Documentation principale
- [ROADMAP.md](ROADMAP.md) - Roadmap du projet
- [VERSIONING.md](VERSIONING.md) - Stratégie de versioning
- [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md) - CI/CD setup

## Code Style

### TypeScript

- Utiliser types stricts
- Pas de `any`
- Documenter les fonctions publiques (JSDoc)

### Svelte

- Utiliser Svelte 5 runes (`$state`, `$derived`, etc.)
- Props avec `let { prop } = $props()`
- Événements avec `onclick={handler}`

### Naming

- Fichiers: kebab-case (`file-name.ts`)
- Classes: PascalCase (`StorageService`)
- Fonctions: camelCase (`sanitizeFilename`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Imports

```typescript
// ✅ Bon
import { storage } from '$lib/server/storage';
import type { RequestHandler } from './$types';

// ❌ Mauvais
import { storage } from '../../../lib/server/storage';
```

## Security

### Checklist

- [ ] Input validation
- [ ] Output sanitization
- [ ] No SQL injection
- [ ] No XSS
- [ ] No path traversal
- [ ] No command injection
- [ ] Rate limiting considéré
- [ ] Secrets jamais committés

### Scan avant Commit

```bash
# Check secrets
git diff | grep -i 'password\|secret\|key\|token'

# Run security scan
npm audit
```

## Pull Request Guidelines

### Titre

```
feat: Add admin dashboard
fix: Correct file upload on Safari
docs: Update API documentation
```

### Description

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (patch)
- [ ] New feature (minor)
- [ ] Breaking change (major)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console.logs left
```

### Taille des PRs

- ✅ Petites PRs (< 500 lignes)
- ⚠️ Moyennes PRs (500-1000 lignes)
- ❌ Grosses PRs (> 1000 lignes) - À découper

## Getting Help

- Consulter [ROADMAP.md](ROADMAP.md)
- Lire [SETUP.md](SETUP.md)
- Créer une Issue GitHub
- Demander dans les Discussions

## License

En contribuant, vous acceptez que votre code soit sous la même licence que le projet (MIT).

---

**Merci de contribuer à PrivaSend !** 🎉
