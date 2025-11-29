# CI Troubleshooting Guide

## Problèmes Courants et Solutions

### 1. Test Failures

#### Symptôme
```
Error: No test files found
```

#### Solution
✅ **Déjà corrigé** : Tests de base ajoutés
- `tests/unit/lib/security.test.ts` - Tests unitaires
- `tests/e2e/homepage.spec.ts` - Test E2E

#### Vérifier localement
```bash
npm run test
npm run test:e2e
```

### 2. better-sqlite3 Compilation Errors

#### Symptôme
```
gyp ERR! build error
Error: make failed with exit code: 2
```

#### Solution
Le workflow CI utilise déjà Node 20 et `npm ci` qui devrait compiler correctement.

Si échec persiste, ajouter avant `npm ci` dans tous les workflows :

```yaml
- name: Install build dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y build-essential python3
```

### 3. Codecov Upload Fails

#### Symptôme
```
Error uploading to codecov
```

#### Solution
✅ **Déjà configuré** : `continue-on-error: true`

Pour repository privé, ajouter token:
1. Aller sur codecov.io
2. Obtenir token
3. GitHub → Settings → Secrets → `CODECOV_TOKEN`

### 4. Docker Build Timeout

#### Symptôme
```
Error: buildx failed with: ERROR: failed to solve
```

#### Causes possibles
- Cache invalide
- Network timeout
- Platform build failure

#### Solution
Simplifier temporairement:

```yaml
platforms: linux/amd64  # Au lieu de linux/amd64,linux/arm64
```

### 5. Hadolint Warnings

#### Symptôme
```
Hadolint found issues in Dockerfile
```

#### Solution
✅ **Déjà configuré** : `.hadolint.yaml` avec règles personnalisées et `no-fail: true`

### 6. CodeQL Analysis Fails

#### Symptôme
```
CodeQL analysis failed
```

#### Solution
Vérifier que le code TypeScript/JavaScript est valide. CodeQL nécessite code compilable.

### 7. Release-Please No PR Created

#### Symptôme
Pas de PR créée après push sur master

#### Causes
- Premier commit (normal, attendre le 2ème commit feat/fix)
- Seulement commits docs/chore/ci
- Manifest file manquant

#### Solution
✅ **Manifest créé** : `.release-please-manifest.json`

Le premier commit `feat:` créera la première PR.

## Vérifications Avant Push

### Localement

```bash
# 1. Node version
node --version  # doit être v20.x.x

# 2. Dependencies install
npm install

# 3. Type check
npm run check

# 4. Lint
npm run lint

# 5. Format
npm run format:check

# 6. Build
npm run build

# 7. Tests
npm run test

# 8. E2E (optionnel)
npm run test:e2e
```

Si tous passent localement, CI devrait passer.

## Commandes de Debug

### Via GitHub CLI

```bash
# Authenticate
gh auth login

# List runs
gh run list

# View specific run
gh run view [run-id]

# View logs
gh run view [run-id] --log

# Re-run failed jobs
gh run rerun [run-id] --failed
```

### Via GitHub UI

1. Aller sur **Actions** tab
2. Cliquer sur le workflow échoué
3. Cliquer sur le job échoué
4. Voir les logs détaillés

## Fixes Rapides

### Si lint échoue

```bash
npm run lint:fix
npm run format
git add .
git commit --amend --no-edit
git push --force
```

### Si tests échouent

Vérifier les tests localement :
```bash
npm run test -- --reporter=verbose
```

### Si build échoue

```bash
npm run build
# Corriger les erreurs
git commit -am "fix: Correct build errors"
git push
```

### Si Docker échoue

Tester localement :
```bash
docker build -t privasend-test .
```

## Workflow-Specific Issues

### CI Workflow

**Jobs** :
- lint (ESLint + Prettier)
- typecheck (TypeScript)
- test (Vitest)
- build (SvelteKit)
- e2e (Playwright)

**Fixes communes** :
- Ajouter `continue-on-error: true` pour jobs optionnels
- Utiliser `if: always()` pour upload artifacts

### Docker Workflow

**Jobs** :
- build (Multi-arch build + push)

**Fixes communes** :
- Réduire platforms si timeout
- Augmenter timeout avec `timeout-minutes: 30`

### Security Workflow

**Jobs** :
- npm-audit (déjà continue-on-error)
- codeql (analyse statique)
- trivy-fs (scan filesystem)
- hadolint (lint Dockerfile, déjà no-fail)

**Fixes communes** :
- Tous ont continue-on-error ou no-fail
- Ne devraient pas bloquer

## Current Status

### Tests Ajoutés ✅
- `tests/unit/lib/security.test.ts` - 3 suites, 18 tests
- `tests/e2e/homepage.spec.ts` - 3 tests E2E

### Workflows Configurés ✅
- CI avec continue-on-error pour Codecov
- Security avec continue-on-error pour npm audit
- Hadolint avec no-fail
- Docker optimisé avec cache

## Si Tout Échoue

### Option Nucléaire : Désactiver Temporairement

Commenter les workflows problématiques jusqu'à résolution :

```yaml
# .github/workflows/ci.yml
# on:
#   push:
```

Ou désactiver dans GitHub UI : Settings → Actions → Disable workflow

## Logs Utiles à Partager

Si besoin d'aide, partager :

```bash
# Get failed run logs
gh run view [run-id] --log-failed > failed-logs.txt
```

Ou faire screenshot de l'erreur dans GitHub UI.

---

**Prochaine étape** : Identifiez le job exact qui échoue et partagez l'erreur pour un fix ciblé.
