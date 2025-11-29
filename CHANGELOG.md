# Changelog

All notable changes to PrivaSend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### To be implemented

- Phase 3: Advanced Security (Authentication, Encryption)
- Phase 4: UX Enhancements
- Phase 5: Admin Dashboard

---

## [0.4.0] - 2025-11-29

### Phase 2: CI/CD & Quality

#### Added

- GitHub Actions CI workflow (lint, test, build, typecheck)
- GitHub Actions Docker workflow (multi-arch build, GHCR publish)
- GitHub Actions Security workflow (Trivy, Hadolint, CodeQL, npm audit)
- Vitest configuration for unit tests
- Playwright configuration for E2E tests
- ESLint configuration with TypeScript and Svelte support
- Prettier configuration for code formatting
- Hadolint configuration for Dockerfile linting
- Codecov configuration for coverage reporting
- Version endpoint: `GET /api/version`
- Release script: `scripts/release.sh`
- Test directory structure

#### Changed

- Updated package.json with test dependencies
- Updated package.json with quality tool scripts
- All CI workflows use `master` branch instead of `main`

#### Documentation

- Added VERSIONING.md - Versioning strategy guide
- Added PHASE_2_COMPLETE.md - Phase 2 documentation
- Added QUICK_START.md - Quick start guide
- Updated ROADMAP.md - Phase 2 marked as complete
- Updated PROJECT_STATUS.md - Phase 2 status

---

## [0.3.0] - 2025-11-29

### Phase 1.4: Basic Security

#### Added

- HTTPS enforcement middleware (production)
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Filename sanitization (path traversal protection)
- Dangerous extension blocking (.exe, .sh, etc.)
- MIME type validation with wildcards
- Rate limiting system (upload, download, API)
- XSS protection utilities

#### Changed

- Updated upload API with security validations
- Updated download API with rate limiting
- Integrated security middleware in hooks.server.ts

#### Security

- Protected against path traversal attacks
- Protected against XSS
- Protected against clickjacking
- Protected against MIME sniffing
- DoS protection via rate limiting

#### Documentation

- Added PHASE_1.4_COMPLETE.md

---

## [0.2.0] - 2025-11-29

### Phase 1.2: Secure Links & Download

#### Added

- SQLite database with WAL mode
- Share links automatic generation
- Download page with file information
- Copy-to-clipboard functionality
- Range requests support (resume downloads)
- Download tracking and statistics
- API for link management: `POST /api/links`, `GET /api/links`
- Download API with streaming: `GET /download/[token]`

#### Changed

- Upload API now returns shareLink in response
- Cleanup service now cleans expired links
- Configuration updated with database and links settings

#### Documentation

- Added PHASE_1.2_COMPLETE.md
- Updated README.md with Phase 1.2 features

---

## [0.1.0] - 2025-11-29

### Phase 1.1: File Upload & Storage

#### Added

- File upload interface with drag & drop
- Large file support (up to 5GB)
- Chunked upload for files > 10MB
- Local filesystem storage
- Automatic file expiration (7 days default)
- Automatic cleanup service
- File metadata management
- Configuration system via .env
- Upload API: `POST /api/upload`
- Docker support with Dockerfile and docker-compose.yml

#### Initial Setup

- SvelteKit 2.x project structure
- TypeScript configuration
- Node.js adapter for deployment
- Storage service with metadata
- Cleanup service with background tasks

#### Documentation

- Added README.md
- Added ROADMAP.md
- Added SETUP.md
- Added PHASE_1.1_COMPLETE.md
- Added test-upload.sh script

---

## Version Mapping

| Version | Phase     | Date       | Status         |
| ------- | --------- | ---------- | -------------- |
| v0.1.0  | Phase 1.1 | 2025-11-29 | ✅ Released    |
| v0.2.0  | Phase 1.2 | 2025-11-29 | ✅ Released    |
| v0.3.0  | Phase 1.4 | 2025-11-29 | ✅ Released    |
| v0.4.0  | Phase 2   | 2025-11-29 | ✅ Released    |
| v1.0.0  | Phase 3   | TBD        | 🔜 Next Stable |

---

## Links

- [GitHub Repository](https://github.com/USER/privasend)
- [Docker Images](https://ghcr.io/USER/privasend)
- [Documentation](README.md)
- [Roadmap](ROADMAP.md)
