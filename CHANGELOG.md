# Changelog

All notable changes to PrivaSend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.5](https://github.com/frederictriquet/PrivaSend/compare/privasend-v0.4.4...privasend-v0.4.5) (2025-12-05)


### Features

* **audit:** Integrate logging in upload, download, and share endpoints ([9603167](https://github.com/frederictriquet/PrivaSend/commit/9603167d5a00aae51e764f1966d52b41b19c14e5))
* **phase-3:** Implement audit logging infrastructure ([23d2965](https://github.com/frederictriquet/PrivaSend/commit/23d29657be3dc9f2ee411f422e9f4dce92158280))
* **phase-4.1:** Add CSS variables for dark/light theme ([dded249](https://github.com/frederictriquet/PrivaSend/commit/dded2495b62171a4d2039b71c8178e23552dbc81))
* **phase-4.1:** Add dark mode with theme toggle ([b92fd0a](https://github.com/frederictriquet/PrivaSend/commit/b92fd0ab8f748064713906cf1d63bf388877a8d5))
* **phase-4.2:** Add download count display ([8401116](https://github.com/frederictriquet/PrivaSend/commit/84011162c8eaa666eb142f54495488afbffc86b4))
* **phase-4.2:** Add QR code for easy sharing ([9243c4b](https://github.com/frederictriquet/PrivaSend/commit/9243c4b781ed56d9ddff66b2173533c4c37739d1))
* **share:** Persist share state across page refreshes ([a575b3d](https://github.com/frederictriquet/PrivaSend/commit/a575b3d5a886f114736069a397ef6c62eb6d15d9))
* **ux:** Improve share-existing UI with inline checkboxes ([15e53cb](https://github.com/frederictriquet/PrivaSend/commit/15e53cb3e06acf0306bcdd330761a2010d71795c))


### Bug Fixes

* **dark-mode:** Apply CSS variables to layout buttons ([b90f7ce](https://github.com/frederictriquet/PrivaSend/commit/b90f7ce464f8b6f89313a1f709d20555429bd6b1))
* **dark-mode:** Apply gradient variables to all page backgrounds ([699e727](https://github.com/frederictriquet/PrivaSend/commit/699e7279151781e9368a4e28d6613077217ee377))
* **dark-mode:** Fix link input text color in dark mode ([46e71fe](https://github.com/frederictriquet/PrivaSend/commit/46e71fe7fc2b57115e40e17e237340d66b9ddea2))
* **download:** Support shared volume files in download page ([8b0891c](https://github.com/frederictriquet/PrivaSend/commit/8b0891c9707cdd118a1e25b152c9bf42600da647))
* **prettier:** Add CSS files to lint-staged ([7c462ed](https://github.com/frederictriquet/PrivaSend/commit/7c462ed1ebbbcbaf0d668b9aaac606b8c08bca87))
* **share:** Fix layout with flexbox and min-width ([a62a34f](https://github.com/frederictriquet/PrivaSend/commit/a62a34fffdc8eb2d34ada91c2bb739e48139773d))
* **share:** Remove conflicting flex from file-info in grid layout ([d5dfdfa](https://github.com/frederictriquet/PrivaSend/commit/d5dfdfae046e00e38a0d8d6b3bf6b4f9b73923a8))
* **share:** Truncate long filenames with ellipsis ([c307073](https://github.com/frederictriquet/PrivaSend/commit/c307073ed2459a617b4ce14f73d0df6057620cef))
* **theme:** Fix theme toggle functionality ([ed5a16d](https://github.com/frederictriquet/PrivaSend/commit/ed5a16db3b0a52f1ced1073622b1e9f4706bb0eb))
* **ui:** Remove upload link from download page ([1fd5b78](https://github.com/frederictriquet/PrivaSend/commit/1fd5b78634a264a9e912d375c5d4a889687f8530))

## [0.4.4](https://github.com/frederictriquet/PrivaSend/compare/privasend-v0.4.3...privasend-v0.4.4) (2025-11-30)


### Features

* **docker:** Add Phase 1.7 auth config to docker-compose files ([f5613c3](https://github.com/frederictriquet/PrivaSend/commit/f5613c3ca50655ce35402d4488b0055b38205181))
* **phase-1.7:** Implement admin authentication ([fe1e496](https://github.com/frederictriquet/PrivaSend/commit/fe1e496fa451a29ddf407a79a2b94d00d2418e97))


### Bug Fixes

* **docker:** Fix better-sqlite3 compilation in Docker ([24ee714](https://github.com/frederictriquet/PrivaSend/commit/24ee71470c6b1d9d336cc7801f520a0828d203d8))
* **docker:** Remove redundant --omit=dev flag ([d1e88e3](https://github.com/frederictriquet/PrivaSend/commit/d1e88e3b37a5fb04fd3cf1075a6630944f20e3f0))
* **docker:** Use builder node_modules with npm prune for production ([9d966ee](https://github.com/frederictriquet/PrivaSend/commit/9d966eeef7008ff8bb77c161428b79f37fe0b5c3))
* **ui:** Don't show file browser when upload is disabled on homepage ([a18e1fc](https://github.com/frederictriquet/PrivaSend/commit/a18e1fcc88c512e7bc5217a7ddc9b5c4fe14ca9d))

## [0.4.3](https://github.com/frederictriquet/PrivaSend/compare/privasend-v0.4.2...privasend-v0.4.3) (2025-11-30)


### Features

* **phase-1.6:** Implement upload disable mode - Backend complete ([66d118d](https://github.com/frederictriquet/PrivaSend/commit/66d118d15aaef5a4908573dd3274e4e54deb33fe))
* **roadmap:** Add Phase 1.6 - Upload Disable Mode (Shared-Only) ([4853cd9](https://github.com/frederictriquet/PrivaSend/commit/4853cd9f6859f1174e5f2230da1fda0c72ee8357))


### Bug Fixes

* **docker:** Skip prepare scripts to avoid Husky errors in Docker build ([c7d93c6](https://github.com/frederictriquet/PrivaSend/commit/c7d93c69bf3d49da21902370a0f2f4bbab311498))

## [0.4.2](https://github.com/frederictriquet/PrivaSend/compare/privasend-v0.4.1...privasend-v0.4.2) (2025-11-30)


### Bug Fixes

* **docker:** Add build tools for native dependencies compilation ([e5c4abc](https://github.com/frederictriquet/PrivaSend/commit/e5c4abc7715527a74bd8b0daace982e6f3224f28))
* **prettier:** Ignore CHANGELOG.md (auto-generated by release-please) ([b25d95a](https://github.com/frederictriquet/PrivaSend/commit/b25d95aeda4d39850bfc4c76123639f2b3b54f23))

## [0.4.1](https://github.com/frederictriquet/PrivaSend/compare/privasend-v0.4.0...privasend-v0.4.1) (2025-11-30)

### Features

- **auth:** Add database schema for password protection and access control ([95077ae](https://github.com/frederictriquet/PrivaSend/commit/95077aebe79406f150a45f5de2cfebd8691d4b13))
- **ci:** Add E2E test results to GitHub Actions Summary ([b6b11ad](https://github.com/frederictriquet/PrivaSend/commit/b6b11ad610afba517ea387a4613f05b78271e4f2))
- **ci:** Display complete test details in GitHub Summary ([6964ec4](https://github.com/frederictriquet/PrivaSend/commit/6964ec485c5bf90948fc036e1aae3c4ca178875d))
- **ci:** Improve E2E test summary with detailed suite breakdown ([67f7e23](https://github.com/frederictriquet/PrivaSend/commit/67f7e2362a5727194a2e08d1f19bd5b873802ce9))
- **ci:** Replace Codecov with GitHub-native coverage reporting ([fea01e1](https://github.com/frederictriquet/PrivaSend/commit/fea01e1438b716c9a3b2d9718952f2df790cbbfc))
- **docker:** Add HTTPS deployment with https-portal ([60507e4](https://github.com/frederictriquet/PrivaSend/commit/60507e4b268a6b0746f6abf7e4e0780ea8159cba))
- **hooks:** Add Husky pre-commit hooks for automatic formatting ([e91676e](https://github.com/frederictriquet/PrivaSend/commit/e91676e1f92ade4cb27cd7fce32d40e1a5523e32))
- Initial PrivaSend implementation with complete CI/CD pipeline ([37bf563](https://github.com/frederictriquet/PrivaSend/commit/37bf563b1446fec037a4a0f68312d404811a0f04))
- **roadmap:** Add Phase 1.5 - Shared Volume file sharing ([90e8b45](https://github.com/frederictriquet/PrivaSend/commit/90e8b45d497fd172a578c6fa4b045ea6caadde00))
- **shared-volume:** Add Phase 1.5 Step 2 API endpoints ([acdb1b5](https://github.com/frederictriquet/PrivaSend/commit/acdb1b5298b71a912d0e927720ba985d5969a400))
- **shared-volume:** Complete Phase 1.5 backend implementation ([17bb78e](https://github.com/frederictriquet/PrivaSend/commit/17bb78ed1b6b2c61832f9b89b0d312afbcd455ff))
- **shared-volume:** Implement Phase 1.5 Step 1 - Backend foundation ([fb76155](https://github.com/frederictriquet/PrivaSend/commit/fb76155270acfb45f11501e627d823c2680d443e))
- **ui:** Add complete frontend for Phase 1.5 shared volume feature ([1949296](https://github.com/frederictriquet/PrivaSend/commit/1949296231fcc51ba96f06afc31eb91eb5f035f0))
- **ui:** Add PrivaSend logo and favicon ([ddf633e](https://github.com/frederictriquet/PrivaSend/commit/ddf633ec8e05b63791b0a64a0dfa7404fb39377f))
- **ui:** Add version and build info to footer on all pages ([22bacab](https://github.com/frederictriquet/PrivaSend/commit/22bacabdf33a696c2b70e7995564be53259d9a17))

### Bug Fixes

- **ci:** Add Codecov token support and improve error handling ([42835c4](https://github.com/frederictriquet/PrivaSend/commit/42835c48e1a942b5e7e22ca6ebeba8c81cf32d96))
- **ci:** Add prettier ignore and format all files ([b02f721](https://github.com/frederictriquet/PrivaSend/commit/b02f7218c553aeaf635c462ae4fe8ca464a1ac4e))
- **ci:** Add tests and improve workflow reliability ([4be9e99](https://github.com/frederictriquet/PrivaSend/commit/4be9e99bce46d6774ea6ea927fd2287f2b9b1f41))
- **ci:** Improve coverage summary parsing from lcov.info ([44404b7](https://github.com/frederictriquet/PrivaSend/commit/44404b7044bd151ce0c1d8785f5d9d6a323d393e))
- **ci:** Resolve linting and build errors ([815e04b](https://github.com/frederictriquet/PrivaSend/commit/815e04b774515da11006ccd1dd01c8bea356c8ec))
- **ci:** Resolve TypeScript and Svelte 5 compatibility issues ([9918fb0](https://github.com/frederictriquet/PrivaSend/commit/9918fb0640e67f79d00d9e844e4fb72a6364b487))
- **ci:** Update to googleapis/release-please-action (non-deprecated) ([61abc71](https://github.com/frederictriquet/PrivaSend/commit/61abc71d0b533e33282015b12b3b2b9e0d96584b))
- **ci:** Upgrade CodeQL actions to v3 and add error handling ([a07f161](https://github.com/frederictriquet/PrivaSend/commit/a07f161efa6e3704fa04e55ae9827a712abede36))
- **ci:** Upgrade CodeQL to v4 and add security-events permissions ([564ca77](https://github.com/frederictriquet/PrivaSend/commit/564ca77288cbf63530669172fa57ffb46b944640))
- **database:** Add missing fields to ShareLink return type ([8f6b1a3](https://github.com/frederictriquet/PrivaSend/commit/8f6b1a38cc530a84fbc2f19027f67976e917de17))
- **deps:** Regenerate package-lock.json for CI compatibility ([6728543](https://github.com/frederictriquet/PrivaSend/commit/67285434975f81ff58b5bb15e09cabeb8e4cb82e))
- **docker:** Correct Trivy image reference for scanning ([1a0d7ec](https://github.com/frederictriquet/PrivaSend/commit/1a0d7ec813a65ee22f6ccfafe5d1478522dd32ff))
- **hooks:** Update to Husky 9 syntax (remove deprecated husky.sh) ([54a3dd9](https://github.com/frederictriquet/PrivaSend/commit/54a3dd91f66f1c8637484f9eb03770206bba7925))
- Remove coverage directory from git tracking ([3ceeff5](https://github.com/frederictriquet/PrivaSend/commit/3ceeff55c617010fc4dbb55eca3ee7f8c708da1f))
- Replace require() with imports and fix flaky timing tests ([cc299df](https://github.com/frederictriquet/PrivaSend/commit/cc299df6de68d845a97ad37a9a22c321a5ccb5df))
- **tests:** Correct date calculation assertions ([856474a](https://github.com/frederictriquet/PrivaSend/commit/856474af28084ea3c6450a42c27d98a9f542069b))
- **tests:** Disable coverage thresholds temporarily ([e839e7a](https://github.com/frederictriquet/PrivaSend/commit/e839e7a0b36f5853eaa9012e009f1918606c3b82))
- **tests:** Remove orphan code and fix ESLint errors ([1a36622](https://github.com/frederictriquet/PrivaSend/commit/1a36622d925573457d0bf4cddbbdfcb060a588aa))

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
