# PrivaSend - Roadmap des Features

## Vue d'ensemble

Application de partage de fichiers privée et sécurisée, alternative à WeTransfer pour VPC ou réseau local.

**Version Actuelle** : v0.4.0
**Status** : ✅ MVP Complet + CI/CD Opérationnel + Shared Volume + Upload Disable
**Dernière Mise à Jour** : 2025-11-30

### Progression Globale

- 🔄 **Phase 1** : MVP (Core Features) - 95% Complete
  - ✅ Phase 1.1-1.4 : Core upload/download (Terminée)
  - ✅ Phase 1.5 : Shared Volume (Terminée)
  - ✅ Phase 1.6 : Upload Disable Mode (Terminée)
  - 🔜 Phase 1.7 : Authentification Admin (Prochaine - HAUTE PRIORITÉ)
- ✅ **Phase 2** : CI/CD & Qualité - 95% Complete (CD partiel)
- ⏳ **Phase 3** : Sécurité Avancée (Auth destinataires, encryption)
- ⏳ **Phases 4-7** : En attente

---

## Phase 1 : MVP (Core Features) 🔄 95% Complete

### 1.1 Gestion des Fichiers ✅

- [x] Upload de fichiers (drag & drop + sélection)
- [x] Support des gros fichiers (streaming/chunked upload)
- [x] Stockage local sur le serveur
- [x] Suppression automatique après expiration
- [x] Limite de taille configurable par fichier/upload

### 1.5 Partage de Fichiers Existants (Volume Mount) ✅ TERMINÉE

- [x] Configuration d'un répertoire de partage (volume Docker)
- [x] Liste des fichiers disponibles dans le répertoire (API)
- [x] Sélection de fichier(s) à partager (UI complète)
- [x] Génération de liens pour fichiers existants (API + UI)
- [x] Isolation sécurisée (seuls les fichiers explicitement partagés sont accessibles)
- [x] Support de sous-répertoires (API + UI)
- [x] Permissions de lecture seule sur le volume
- [x] Preview des fichiers disponibles (nom, taille, type)
- [x] Téléchargement de fichiers partagés (download handler)
- [x] Mode hybride : upload OU sélection de fichier existant (navigation tabs)
- [x] Page UI de navigation /share-existing (complète)
- [x] File browser avec breadcrumbs et icônes
- [x] Copy-to-clipboard pour liens shared
- [x] États error/loading/empty
- [x] Design professionnel

**Fonctionnalité production-ready !** Tests E2E à ajouter en amélioration continue.

### 1.6 Mode Shared-Only (Désactivation Upload) ✅ TERMINÉE

- [x] Variable d'environnement UPLOAD_ENABLED (default: true)
- [x] Désactivation complète de l'upload côté serveur (sécurité)
- [x] Endpoint API /api/upload refuse les requêtes (403 Forbidden)
- [x] Endpoint /api/config pour exposer la configuration au client
- [x] Page d'accueil avec logique server-side (+page.server.ts)
- [x] Redirection automatique vers /share-existing si upload disabled
- [x] Message d'erreur clair "File upload is disabled on this server"
- [x] Tests unitaires : config.upload.enabled (9 tests)
- [x] Tests de sécurité API : vérification du blocage (10+ tests)
- [x] Tests E2E : UI, API, redirection (10+ tests)
- [x] Documentation complète (PHASE_1.6_UPLOAD_DISABLE_SPEC.md)

**Fonctionnalité production-ready !** Backend sécurisé, tests complets, 3 modes opérationnels :

- **Upload-only** : UPLOAD_ENABLED=true, SHARED_VOLUME_ENABLED=false
- **Shared-only** : UPLOAD_ENABLED=false, SHARED_VOLUME_ENABLED=true
- **Hybrid** : Les deux activés (mode par défaut)

### 1.7 Authentification Administrateur 🔜 PROCHAINE

**Objectif** : Protéger l'accès aux fonctionnalités d'upload et de sélection de fichiers par mot de passe.

**Cas d'usage** : L'administrateur peut uploader des fichiers et créer des liens de partage, les destinataires peuvent uniquement télécharger via les liens partagés (sans authentification).

#### Backend - Session & Auth

- [ ] Configuration mot de passe admin (variable d'environnement `ADMIN_PASSWORD`)
- [ ] Hash du mot de passe avec bcrypt (déjà installé)
- [ ] Session management (cookie sécurisé, httpOnly, SameSite)
- [ ] Middleware d'authentification pour protéger les routes admin
- [ ] Endpoint `POST /api/auth/login` (vérification mot de passe)
- [ ] Endpoint `POST /api/auth/logout` (destruction session)
- [ ] Endpoint `GET /api/auth/status` (check si authentifié)
- [ ] Protection routes API :
  - `POST /api/upload` → requiert auth admin
  - `POST /api/shared/link` → requiert auth admin (sélection fichiers)
  - `GET /api/shared/browse` → requiert auth admin
- [ ] Les routes de download restent publiques (pas d'auth requise)

#### Frontend - Login & Protection

- [ ] Page de login `/login` avec formulaire mot de passe
- [ ] Redirection automatique vers `/login` si non authentifié
- [ ] Store Svelte pour l'état d'authentification
- [ ] Protection des pages :
  - `/` (upload) → requiert auth, sinon redirect vers `/login`
  - `/share-existing` → requiert auth, sinon redirect vers `/login`
  - `/download/[token]` → accessible sans auth (public)
- [ ] Bouton "Logout" dans l'interface admin
- [ ] Message "Session expirée" avec redirect vers login
- [ ] Gestion des erreurs 401 (token invalide)

#### Sécurité

- [ ] Rate limiting sur `/api/auth/login` (3 tentatives/minute)
- [ ] CSRF protection (SvelteKit intégré)
- [ ] Session timeout configurable (default: 24h)
- [ ] Logs des tentatives de connexion (succès/échec)
- [ ] Headers sécurisés pour les cookies (Secure, HttpOnly, SameSite=Strict)
- [ ] Invalidation de session côté serveur (blacklist ou session store)

#### Configuration

```env
# Authentication (Phase 1.7)
ADMIN_PASSWORD=your-secure-password-here  # Requis en production
SESSION_SECRET=random-secret-for-signing  # Auto-généré si absent
SESSION_TIMEOUT_HOURS=24                   # Durée de validité de la session
LOGIN_RATE_LIMIT=3                         # Tentatives par minute
```

#### Tests

- [ ] Tests unitaires : bcrypt hash/verify
- [ ] Tests unitaires : session management
- [ ] Tests API : login success/failure
- [ ] Tests API : protected routes (401 sans auth)
- [ ] Tests API : logout
- [ ] Tests E2E : workflow complet login → upload → logout
- [ ] Tests E2E : download public sans auth
- [ ] Tests de sécurité : rate limiting login
- [ ] Tests de sécurité : CSRF protection

#### Documentation

- [ ] Guide d'authentification (AUTHENTICATION.md)
- [ ] Configuration du mot de passe admin
- [ ] Procédure de changement de mot de passe
- [ ] Gestion des sessions
- [ ] Procédure de reset en cas d'oubli

**Estimation** : 1-2 jours (8-16h)

**Priorité** : **HAUTE** - Sécurité critique pour déploiement production

**Note** : Cette phase transforme PrivaSend en solution self-hosted sécurisée où :

- Admin authentifié → Upload + Création de liens
- Utilisateurs publics → Download uniquement via liens partagés

### 1.2 Génération de Liens Sécurisés ✅

- [x] Génération d'URLs HTTPS uniques et aléatoires
- [x] Tokens sécurisés (nanoid cryptographique)
- [x] Durée de validité configurable (7j par défaut)
- [x] Lien de partage copié dans le presse-papier

### 1.3 Téléchargement ✅

- [x] Page de téléchargement simple
- [x] Téléchargement direct via lien
- [x] Affichage des métadonnées (nom, taille, date d'expiration)
- [x] Support du download resume (Range headers)

### 1.4 Sécurité de Base ✅

- [x] HTTPS obligatoire (production)
- [x] Protection contre les injections/XSS
- [x] Validation des types de fichiers
- [x] Rate limiting basique

---

## Phase 2 : CI/CD & Qualité ✅ TERMINÉE

### 2.1 Intégration Continue (CI) ✅

- [x] Configuration GitHub Actions
- [x] Pipeline de build automatisé
- [x] Tests automatiques sur chaque PR
- [x] Validation de code (linting, formatting)
- [x] Checks de sécurité automatiques

### 2.2 Tests Automatisés ✅

- [x] Tests unitaires (Vitest) - Infrastructure prête
- [x] Tests d'intégration - Infrastructure prête
- [x] Tests E2E (Playwright) - Infrastructure prête
- [x] Coverage minimal requis (80%) - Configuration prête
- [x] Tests de sécurité (npm audit, CodeQL)

### 2.3 Docker & Registry ✅

- [x] Build multi-stage optimisé (Dockerfile existant)
- [x] Publication automatique sur GitHub Container Registry (ghcr.io)
- [x] Versioning sémantique des images
- [x] Images pour différentes architectures (amd64, arm64)
- [x] Scan de vulnérabilités des images (Trivy)

### 2.4 Analyse de Qualité ✅

- [x] Analyse Dockerfile avec Hadolint
- [x] Scan de vulnérabilités des dépendances (npm audit)
- [x] Analyse statique du code (CodeQL)
- [x] Vérification des secrets (GitGuardian via CodeQL)
- [ ] Licence compliance check (manuel pour l'instant)

### 2.5 Rapports & Métriques ✅

- [x] Publication automatique du coverage de tests (Codecov)
- [x] Rapports d'audit de sécurité (GitHub Security tab)
- [x] Génération de badges (coverage, build status, security)
- [x] Dashboard de qualité du code (Codecov)
- [x] Changelog automatique (release-please configuré)
- [x] Versioning automatique (release-please + semantic versioning)

### 2.6 Déploiement Continu (CD) 🔜

- [ ] Déploiement automatique en staging
- [ ] Déploiement manuel en production (avec approbation)
- [ ] Rollback automatique en cas d'échec
- [ ] Health checks post-déploiement
- [ ] Notifications Slack/Discord

**Note**: Section 2.6 (CD) laissée pour Phase 7, focalisée sur CI pour l'instant

**⚠️ Configuration GitHub Requise** :

Pour activer release-please et uploads Security tab, configurer dans GitHub :
**Settings → Actions → General → Workflow permissions** :

- ☑ Read and write permissions
- ☑ Allow GitHub Actions to create and approve pull requests

---

## Phase 3 : Sécurité Avancée

**Note** : La Phase 1.7 (Authentification Admin) est désormais la priorité principale pour la sécurité.

### 3.1 Protection Avancée des Liens

- [ ] Protection par mot de passe optionnelle (par lien individuel)
- [ ] Code PIN à usage unique (par lien)
- [ ] Limite du nombre de téléchargements configurables (1x, 5x, illimité)
- [ ] Liste blanche d'adresses IP (par lien)
- [ ] Date d'expiration personnalisée par lien
- [ ] Notification email au créateur lors du téléchargement

### 3.2 Chiffrement des Fichiers

- [ ] Chiffrement des fichiers au repos (AES-256)
- [ ] Chiffrement de bout en bout optionnel (client-side)
- [ ] Gestion sécurisée des clés de chiffrement
- [ ] Déchiffrement côté client pour E2EE
- [ ] Rotation automatique des clés

### 3.3 Audit & Traçabilité

- [ ] Logs d'accès (qui, quand, depuis où)
- [ ] Notifications de téléchargement
- [ ] Historique des partages
- [ ] Alertes en cas d'activité suspecte

---

## Phase 4 : Expérience Utilisateur

### 4.1 Interface Web Moderne

- [ ] Design responsive (mobile-first)
- [ ] Mode sombre/clair
- [ ] Glisser-déposer intuitif
- [ ] Barre de progression pour uploads/downloads
- [ ] Prévisualisation des fichiers (images, PDF, vidéos)

### 4.2 Gestion Multi-fichiers

- [ ] Upload de dossiers complets
- [ ] Archive automatique (ZIP) pour multiple files
- [ ] Téléchargement en batch
- [ ] Organisation par collections/dossiers

### 4.3 Notifications & Communication

- [ ] Envoi automatique du lien par email
- [ ] Notification de téléchargement au partageur
- [ ] Message personnalisé avec le partage
- [ ] QR Code pour partage facile

---

## Phase 5 : Administration & Gestion

### 5.1 Dashboard Administrateur

- [ ] Vue d'ensemble des fichiers partagés
- [ ] Statistiques d'utilisation (stockage, bande passante)
- [ ] Gestion des utilisateurs/quotas
- [ ] Nettoyage manuel des fichiers

### 5.2 Configuration Avancée

- [ ] Paramètres de rétention par défaut
- [ ] Quotas de stockage par utilisateur
- [ ] Politique de sécurité personnalisable
- [ ] Branding personnalisé (logo, couleurs)

### 5.3 Monitoring

- [ ] Métriques de performance
- [ ] Alertes sur espace disque
- [ ] Logs d'audit complets
- [ ] Rapports d'utilisation

---

## Phase 6 : Intégrations & API

### 6.1 API RESTful

- [ ] Endpoints pour upload/download programmatique
- [ ] Gestion des tokens API
- [ ] Documentation OpenAPI/Swagger
- [ ] SDK pour langages populaires (Python, Node.js, Go)

### 6.2 CLI

- [ ] Command-line tool pour upload
- [ ] Intégration avec scripts shell
- [ ] Configuration profiles
- [ ] Upload/download avec barre de progression

### 6.3 Intégrations Tierces

- [ ] Webhook lors d'événements (upload, download, expiration)
- [ ] Intégration Slack/Teams pour notifications
- [ ] Support S3-compatible storage
- [ ] Plugin navigateur (extension Chrome/Firefox)

---

## Phase 7 : Fonctionnalités Avancées

### 7.1 Collaboration

- [ ] Partage avec plusieurs destinataires
- [ ] Commentaires sur les fichiers
- [ ] Versioning des fichiers
- [ ] Espaces de travail partagés

### 7.2 Conformité & Réglementation

- [ ] Conformité RGPD
- [ ] Audit trail pour compliance
- [ ] Rétention légale des données
- [ ] Export de données utilisateur

### 7.3 Performance & Scalabilité

- [ ] Support multi-serveurs (load balancing)
- [ ] CDN pour distribution géographique
- [ ] Cache intelligent
- [ ] Compression automatique

### 7.4 Fonctionnalités Bonus

- [ ] Génération de liens publics temporaires
- [ ] Galerie de fichiers partagés publiquement
- [ ] Scan antivirus automatique
- [ ] Watermarking automatique des images
- [ ] Conversion de formats (optionnel)

---

## Architecture Technique Implémentée ✅

### Stack Actuel

**Backend & Frontend** :

- ✅ **Framework**: SvelteKit 2.x (full-stack)
- ✅ **Langage**: TypeScript (strict mode désactivé pour Svelte 5 compat)
- ✅ **Base de données**: SQLite (better-sqlite3 avec mode WAL)
- ✅ **Stockage**: Filesystem local avec métadonnées JSON
- ✅ **Runtime**: Node.js 20 LTS
- ✅ **Build**: Vite
- ✅ **Adapter**: @sveltejs/adapter-node

**Sécurité** :

- ✅ **HTTPS**: Redirection forcée en production
- ✅ **Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **Validation**: Sanitization, MIME types, extensions dangereuses
- ✅ **Rate Limiting**: In-memory (10 uploads/h, 100 downloads/h)
- 🔜 **Authentification Admin**: À implémenter (Phase 1.7 - PRIORITÉ HAUTE)
- ⏳ **Chiffrement**: À implémenter (Phase 3.2)
- ⏳ **Protection des liens**: À implémenter (Phase 3.1)

**CI/CD** :

- ✅ **GitHub Actions**: CI, Docker, Security, Release-Please
- ✅ **Tests**: Vitest (unitaires) + Playwright (E2E)
- ✅ **Qualité**: ESLint, Prettier, TypeScript
- ✅ **Scans**: Trivy, Hadolint, CodeQL, npm audit
- ✅ **Docker**: Multi-arch (amd64, arm64)
- ✅ **Registry**: GitHub Container Registry (ghcr.io)
- ✅ **Versioning**: Semantic versioning avec release-please

### Architecture Technique Suggérée (Pour Évolution)

### Déploiement

- **Conteneurisation**: Docker + Docker Compose
- **Reverse Proxy**: Caddy ou Nginx
- **Monitoring**: Prometheus + Grafana (optionnel)

---

## Priorités de Développement

1. **MVP fonctionnel** (Phase 1.1-1.6) - ✅ TERMINÉ (2025-11-30)
2. **CI/CD & Qualité** (Phase 2) - ✅ TERMINÉ (2025-11-29)
3. **🔥 Authentification Admin** (Phase 1.7) - 1-2 jours - 🔜 **PROCHAINE (HAUTE PRIORITÉ)**
4. **Sécurité Avancée** (Phase 3) - 1-2 semaines
5. **UX Améliorée** (Phase 4) - 1-2 semaines
6. **Administration** (Phase 5) - 1 semaine
7. **API & Intégrations** (Phase 6) - 2 semaines
8. **Fonctionnalités Avancées** (Phase 7) - évolutif

**Note** : La Phase 1.7 est critique pour le déploiement en production. Sans authentification admin, l'application est vulnérable aux uploads non autorisés.

---

## Métriques Actuelles (v0.4.0)

### Code

- **Fichiers source** : ~75 fichiers
- **Lignes de code** : ~14,000 lignes
- **Langage** : TypeScript + Svelte
- **Tests** : 230+ tests (unitaires + E2E)
  - Config tests: 9 tests
  - Security tests: 80+ tests
  - Rate limit tests: 100+ tests
  - Config tests: 27 tests
  - Upload security: 10+ tests
  - E2E tests: 20+ tests (homepage, navigation, upload-disabled)
- **Coverage** : ~15% (en amélioration continue)

### Infrastructure

- **CI/CD** : 4 workflows GitHub Actions opérationnels
- **Docker** : Image multi-arch publiée sur ghcr.io
- **Security** : 4 types de scans automatiques
- **Documentation** : 15+ fichiers de documentation

### Fonctionnalités

- **Upload** : Fichiers jusqu'à 5GB avec chunking
- **Download** : Streaming avec Range requests
- **Links** : Génération automatique sécurisée (32 chars)
- **Security** : Rate limiting, validation, headers
- **Database** : SQLite avec tracking des liens

---

## Cas d'Usage Principaux

1. **Réseau local d'entreprise**: Partage rapide entre collègues sans email
2. **VPC/Cloud privé**: Distribution de builds, assets, backups
3. **Freelance/Client**: Livraison de fichiers de travail sécurisée
4. **Personnel**: Partage de photos/vidéos familiales
5. **Événementiel**: Distribution de contenus aux participants

---

## Différenciateurs vs WeTransfer

✅ Auto-hébergé (contrôle total des données)
✅ Pas de limite de taille arbitraire
✅ Fonctionne en réseau local/VPC
✅ Chiffrement de bout en bout
✅ Open source
✅ Pas de tracking/analytics tiers
✅ Personnalisable à 100%
