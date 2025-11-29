# Phase 7 - CI/CD & Qualité - Plan Détaillé

**Status**: PLANIFICATION
**Date**: 2025-11-29

## Vue d'ensemble

La Phase 7 vise à mettre en place une infrastructure complète de CI/CD et d'assurance qualité pour PrivaSend, en utilisant GitHub Actions et les meilleures pratiques de l'industrie.

## Objectifs

1. **Automatiser** : Build, tests, déploiements
2. **Sécuriser** : Scan de vulnérabilités, analyse statique
3. **Qualité** : Coverage tests, linting, formatage
4. **Transparence** : Rapports publics, badges, métriques

## Phase 7.1 : Intégration Continue (CI)

### Workflow GitHub Actions Principal

**Fichier**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: build/
```

### Checks Requis sur PR

- ✅ Linting (ESLint + Prettier)
- ✅ Type checking (TypeScript)
- ✅ Tests unitaires (min 80% coverage)
- ✅ Build réussi
- ✅ Scan de sécurité

## Phase 7.2 : Tests Automatisés

### Structure des Tests

```
tests/
├── unit/
│   ├── lib/
│   │   ├── storage.test.ts
│   │   ├── database.test.ts
│   │   ├── security.test.ts
│   │   └── ratelimit.test.ts
│   └── routes/
│       ├── upload.test.ts
│       └── download.test.ts
├── integration/
│   ├── upload-flow.test.ts
│   └── download-flow.test.ts
└── e2e/
    ├── upload.spec.ts
    └── download.spec.ts
```

### Configuration Vitest

**Fichier**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    globals: true,
    environment: 'node'
  }
});
```

### Tests E2E avec Playwright

**Fichier**: `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Phase 7.3 : Docker & Container Registry

### Workflow Docker Build & Push

**Fichier**: `.github/workflows/docker.yml`

```yaml
name: Docker

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Versioning Sémantique

- **Tags manuels**: `v1.0.0`, `v1.1.0`, etc.
- **Images automatiques**:
  - `latest` (main branch)
  - `v1.0.0` (version tag)
  - `v1.0` (major.minor)
  - `sha-abc123` (commit SHA)

## Phase 7.4 : Analyse de Qualité

### Scan Trivy (Vulnérabilités Container)

**Fichier**: `.github/workflows/security.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  hadolint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Hadolint
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
          format: sarif
          output-file: hadolint-results.sarif

      - name: Upload Hadolint results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: hadolint-results.sarif

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm audit --audit-level=moderate

  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
        with:
          languages: typescript, javascript
      - uses: github/codeql-action/analyze@v2
```

### Hadolint Configuration

**Fichier**: `.hadolint.yaml`

```yaml
ignored:
  - DL3008  # Pin versions in apt-get install
  - DL3018  # Pin versions in apk add

trustedRegistries:
  - docker.io
  - ghcr.io
```

## Phase 7.5 : Rapports & Métriques

### Badge README

**À ajouter dans README.md**:

```markdown
[![CI](https://github.com/USER/privasend/workflows/CI/badge.svg)](https://github.com/USER/privasend/actions)
[![Docker](https://github.com/USER/privasend/workflows/Docker/badge.svg)](https://github.com/USER/privasend/actions)
[![codecov](https://codecov.io/gh/USER/privasend/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/privasend)
[![Security](https://github.com/USER/privasend/workflows/Security%20Scan/badge.svg)](https://github.com/USER/privasend/security)
```

### Codecov Configuration

**Fichier**: `codecov.yml`

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 5%
    patch:
      default:
        target: 80%

comment:
  layout: "reach,diff,flags,tree,footer"
  behavior: default
  require_changes: false
```

### Rapport de Sécurité Automatique

- GitHub Security Advisories activé
- Dependabot alerts activé
- Code scanning avec CodeQL
- Rapport Trivy publié dans Security tab

## Phase 7.6 : Déploiement Continu (CD)

### Workflow Deployment

**Fichier**: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy-staging:
    if: github.event_name == 'push' || github.event.inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      # Deployment steps for staging

  deploy-production:
    if: github.event.inputs.environment == 'production' || startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://privasend.example.com
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4
      # Deployment steps for production
```

### Health Check Post-Déploiement

```yaml
- name: Health Check
  run: |
    for i in {1..10}; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://privasend.example.com/health)
      if [ $STATUS -eq 200 ]; then
        echo "✅ Health check passed"
        exit 0
      fi
      echo "⏳ Waiting for service... ($i/10)"
      sleep 10
    done
    echo "❌ Health check failed"
    exit 1
```

## Phase 7.7 : Dépendances à Ajouter

### package.json

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/svelte": "^4.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-svelte": "^2.35.0",
    "prettier": "^3.1.0",
    "prettier-plugin-svelte": "^3.1.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.js,.svelte",
    "format": "prettier --write 'src/**/*.{js,ts,svelte,json,css}'",
    "format:check": "prettier --check 'src/**/*.{js,ts,svelte,json,css}'"
  }
}
```

## Calendrier d'Implémentation

### Semaine 1 : CI & Tests
- **Jour 1-2** : Configuration GitHub Actions basique
- **Jour 3-4** : Mise en place des tests unitaires
- **Jour 5** : Intégration Codecov

### Semaine 2 : Docker & Sécurité
- **Jour 1-2** : Workflow Docker + GHCR
- **Jour 3** : Trivy + Hadolint
- **Jour 4-5** : CodeQL + npm audit

### Semaine 3 : CD & Finalisation (optionnel)
- **Jour 1-2** : Workflow déploiement
- **Jour 3** : Health checks + rollback
- **Jour 4-5** : Documentation + badges

## Métriques de Succès

- ✅ 100% des PRs passent CI
- ✅ Coverage tests > 80%
- ✅ Zéro vulnérabilité CRITICAL/HIGH
- ✅ Build Docker < 5 minutes
- ✅ Déploiement automatique fonctionnel

## Outils Alternatifs

Si GitHub Actions n'est pas disponible :

- **GitLab CI** : Très similaire, excellent
- **CircleCI** : Bon pour projets open-source
- **Jenkins** : Pour auto-hébergement
- **Drone CI** : Léger et efficace

## Coûts

- **GitHub Actions** : 2000 minutes/mois gratuites
- **GitHub Container Registry** : 500MB gratuit
- **Codecov** : Gratuit pour open-source
- **CodeQL** : Gratuit sur GitHub

**Total estimé** : 0€ pour projet open-source

## Documentation Requise

1. **CONTRIBUTING.md** : Guide de contribution
2. **TESTING.md** : Comment écrire et lancer les tests
3. **DEPLOYMENT.md** : Process de déploiement
4. **SECURITY.md** : Politique de sécurité

## Références

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Hadolint Documentation](https://github.com/hadolint/hadolint)

---

**Note** : Cette phase peut être implémentée en parallèle du développement des autres phases. L'idéal est de la mettre en place tôt pour bénéficier de la CI dès le début.

**Agent Recommandé** : Utiliser l'agent `github-ci-specialist` pour générer les workflows GitHub Actions optimisés.
