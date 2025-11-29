# PrivaSend - Quick Start Guide

Guide de démarrage ultra-rapide pour développeurs.

## TL;DR

```bash
# Requirement: Node.js 20 LTS
nvm use 20  # ou nvm alias default 20

# Setup
npm install
cp .env.example .env

# Development
npm run dev

# Open http://localhost:5173
```

## État Actuel du Projet

**Version**: v0.4.0 (Phase 1 + Phase 2 complètes)
**Status**: ✅ MVP + CI/CD complets

### Phases Terminées

- ✅ **Phase 1.1-1.4** : Upload, Download, Links, Security
- ✅ **Phase 2** : CI/CD complet, tests, qualité

### Fonctionnalités Actives

- Upload de fichiers jusqu'à 5GB
- Liens partageables sécurisés
- Téléchargement avec streaming
- Rate limiting
- Security headers
- CI/CD automatique

## Installation

### Prérequis

- **Node.js 20 LTS** (requis pour better-sqlite3)
- npm ou pnpm
- Git

### Étapes

```bash
# 1. Clone (si pas déjà fait)
git clone https://github.com/USER/privasend.git
cd privasend

# 2. Install Node 20
nvm install 20
nvm use 20

# 3. Install dependencies
npm install

# 4. Configure
cp .env.example .env

# 5. Run
npm run dev
```

## Commandes Essentielles

### Développement

```bash
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Build production
npm run preview      # Preview build
```

### Quality

```bash
npm run lint         # Lint code
npm run format       # Format code
npm run check        # Type check
npm run test         # Run tests
npm run test:coverage  # Tests with coverage
```

### Pre-commit

```bash
npm run lint && npm run format:check && npm run check
```

## Docker

### Quick Start

```bash
docker-compose up -d
```

### From GitHub Container Registry

```bash
docker pull ghcr.io/USER/privasend:latest
docker run -p 3000:3000 -v ./storage:/app/storage ghcr.io/USER/privasend:latest
```

## Configuration Rapide

Fichier `.env`:

```env
# Essentials
STORAGE_PATH=./storage
MAX_FILE_SIZE=5368709120     # 5GB

# Expiration
DEFAULT_EXPIRATION_DAYS=7
LINK_EXPIRATION_DAYS=7

# Optional: Restrict file types
ALLOWED_MIME_TYPES=          # Empty = all types
```

## Résolution Rapide de Problèmes

### npm install fails

```bash
# Vérifier Node version
node --version  # doit être v20.x.x

# Si Node 25+
nvm install 20
nvm alias default 20

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Port already in use

```bash
# Change port in vite.config.ts ou
PORT=3001 npm run dev
```

### Storage errors

```bash
# Reset storage
rm -rf storage/
mkdir -p storage/metadata
```

## Workflows CI/CD

### Déclencher manuellement

```bash
# Via GitHub UI: Actions → Select workflow → Run workflow

# Ou avec gh CLI
gh workflow run ci.yml
```

### Voir les résultats

```bash
gh run list
gh run view [run-id]
```

## Déploiement Production

### Option 1: Docker

```bash
docker-compose -f docker-compose.yml up -d
```

### Option 2: Direct

```bash
npm run build
NODE_ENV=production node build
```

### Option 3: GitHub Container Registry

```bash
docker pull ghcr.io/USER/privasend:v1.0.0
docker run -d -p 3000:3000 \
  -v ./storage:/app/storage \
  -e NODE_ENV=production \
  ghcr.io/USER/privasend:v1.0.0
```

## Structure du Projet

```
PrivaSend/
├── src/                    # Code source
│   ├── lib/server/        # Backend logic
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── storage.ts
│   │   ├── security.ts
│   │   ├── ratelimit.ts
│   │   └── cleanup.ts
│   └── routes/            # Pages & API
│       ├── +page.svelte   # Upload page
│       ├── api/upload/
│       └── download/[token]/
├── tests/                 # Tests
│   ├── unit/
│   └── e2e/
├── .github/workflows/     # CI/CD
├── storage/               # File storage (gitignored)
└── Configurations         # Various config files
```

## Documentation

- [README.md](README.md) - Documentation complète
- [ROADMAP.md](ROADMAP.md) - Roadmap features
- [SETUP.md](SETUP.md) - Setup détaillé
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - État du projet
- [PHASE_1.1_COMPLETE.md](PHASE_1.1_COMPLETE.md) - Phase 1.1
- [PHASE_1.2_COMPLETE.md](PHASE_1.2_COMPLETE.md) - Phase 1.2
- [PHASE_1.4_COMPLETE.md](PHASE_1.4_COMPLETE.md) - Phase 1.4
- [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md) - Phase 2
- [PHASE_7_CI_CD_PLAN.md](PHASE_7_CI_CD_PLAN.md) - Plan CI/CD détaillé

## Support

Questions? Consulter:
1. [ROADMAP.md](ROADMAP.md) pour les features
2. [SETUP.md](SETUP.md) pour l'installation
3. [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md) pour CI/CD

---

**Version**: v0.4.0
**Last Update**: 2025-11-29
**Status**: ✅ Production Ready (avec CI/CD)
