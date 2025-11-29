# Conventional Commits Guide

PrivaSend utilise [Conventional Commits](https://www.conventionalcommits.org/) pour générer automatiquement les versions et le CHANGELOG.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

### Features (MINOR: 0.4.0 → 0.5.0)

```bash
feat: Add password protection for links
feat(upload): Support multiple file upload
feat(api): Add new statistics endpoint
```

### Fixes (PATCH: 0.4.0 → 0.4.1)

```bash
fix: Correct file upload timeout
fix(download): Handle network interruption
fix(security): Patch XSS vulnerability
```

### Breaking Changes (MAJOR: 0.4.0 → 1.0.0)

```bash
# Method 1: ! after type
feat!: Change API response structure

# Method 2: BREAKING CHANGE in footer
feat: New authentication system

BREAKING CHANGE: Old auth tokens are no longer valid
```

### Other Types (No version bump)

```bash
docs: Update README installation steps
docs(api): Add endpoint documentation

chore: Update dependencies
chore(deps): Bump nanoid to v5.1.0

style: Format code with Prettier
style: Fix indentation

refactor: Restructure storage service
refactor(database): Optimize queries

test: Add unit tests for security module
test(e2e): Add upload flow test

ci: Update GitHub Actions workflow
ci: Add Trivy scan to pipeline

perf: Optimize file streaming
perf(upload): Reduce memory usage

security: Update vulnerable dependencies
security: Patch SQL injection
```

## Scopes (optionnel mais recommandé)

Scopes pour PrivaSend:

- `upload` - Upload functionality
- `download` - Download functionality
- `links` - Share links management
- `security` - Security features
- `database` - Database operations
- `storage` - File storage
- `api` - API endpoints
- `ui` - User interface
- `config` - Configuration
- `docker` - Docker/deployment
- `ci` - CI/CD
- `docs` - Documentation
- `tests` - Tests

## Exemples Complets

### Simple

```bash
git commit -m "feat: Add dark mode toggle"
```

### Avec Scope

```bash
git commit -m "fix(upload): Handle large file timeout"
```

### Avec Body

```bash
git commit -m "feat(auth): Add OAuth2 support

Implements OAuth2 authentication flow with support for:
- Google
- GitHub
- Microsoft"
```

### Avec Breaking Change

```bash
git commit -m "feat!: Migrate to PostgreSQL

BREAKING CHANGE: SQLite database will not be migrated automatically.
Run migration script before upgrading."
```

### Multiple Paragraphes

```bash
git commit -m "fix(download): Improve error handling

Previously, network errors during download would cause
the entire application to crash.

Now, errors are caught and displayed to the user with
a retry option.

Closes #123"
```

## Release-Please Workflow

### Comment ça marche

1. **Vous committez** sur master avec Conventional Commits
2. **Release-please bot** analyse les commits
3. **PR automatique** créée avec:
   ```
   Title: chore: release 0.5.0
   Body: CHANGELOG des nouveautés
   Files: package.json, CHANGELOG.md
   ```
4. **Vous reviewez** la PR de release
5. **Mergez** → Release créée automatiquement !

### Exemple Concret

```bash
# Semaine 1-2: Développement
git commit -m "feat(admin): Add dashboard page"
git commit -m "feat(admin): Add user management"
git commit -m "fix(upload): Correct progress bar"
git push origin master

# → release-please crée PR: "chore: release 0.5.0"

# Review PR (vérifier CHANGELOG)
# Merge PR

# → Automatiquement:
# - Tag v0.5.0 créé
# - GitHub Release créée
# - Docker build triggered
# - Image publiée sur ghcr.io
```

## Règles

### ✅ DO

- Utiliser Conventional Commits pour tous les commits
- Être descriptif dans le message
- Utiliser scopes quand pertinent
- Marquer breaking changes avec `!` ou `BREAKING CHANGE:`
- Référencer issues avec `Closes #123`
- Garder commits atomiques (une chose par commit)

### ❌ DON'T

- Commits vagues: `fix stuff`, `WIP`, `update`
- Commits mixant plusieurs types
- Oublier le `:` après le type
- Utiliser majuscule au début du message
- Messages trop longs (> 72 caractères pour le titre)

## Exemples par Phase

### Phase 3 (Security)

```bash
feat(auth): Add user authentication
feat(links): Add password protection
feat(crypto): Implement file encryption
security(deps): Update vulnerable packages
```

### Phase 4 (UX)

```bash
feat(ui): Add dark mode
feat(upload): Support drag and drop folders
feat(preview): Add file preview for images
perf(ui): Optimize rendering performance
```

### Phase 5 (Admin)

```bash
feat(admin): Add dashboard
feat(admin): Add storage statistics
feat(admin): Add user management
refactor(admin): Restructure admin routes
```

## Git Hooks (Validation)

Pour valider les commits automatiquement, installer commitlint:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

**`.commitlintrc.json`:**

```json
{
	"extends": ["@commitlint/config-conventional"],
	"rules": {
		"type-enum": [
			2,
			"always",
			["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci", "security"]
		]
	}
}
```

**`.husky/commit-msg`:**

```bash
#!/bin/sh
npx --no -- commitlint --edit $1
```

## Quick Reference

| Commit Type        | Version Bump          | Description                 |
| ------------------ | --------------------- | --------------------------- |
| `feat:`            | MINOR (0.4.0 → 0.5.0) | New feature                 |
| `fix:`             | PATCH (0.4.0 → 0.4.1) | Bug fix                     |
| `feat!:`           | MAJOR (0.4.0 → 1.0.0) | Breaking change             |
| `BREAKING CHANGE:` | MAJOR                 | Breaking change (in footer) |
| `docs:`            | None                  | Documentation               |
| `chore:`           | None                  | Maintenance                 |
| `refactor:`        | None                  | Refactoring                 |
| `perf:`            | PATCH                 | Performance                 |
| `test:`            | None                  | Tests                       |
| `ci:`              | None                  | CI/CD                       |
| `security:`        | PATCH                 | Security fix                |

## Resources

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Release Please Docs](https://github.com/googleapis/release-please)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Questions?** Voir [CONTRIBUTING.md](../CONTRIBUTING.md)
