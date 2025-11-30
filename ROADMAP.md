# PrivaSend - Roadmap des Features

## Vue d'ensemble

Application de partage de fichiers privée et sécurisée, alternative à WeTransfer pour VPC ou réseau local.

**Version Actuelle** : v0.4.0
**Status** : ✅ MVP Complet + CI/CD Opérationnel
**Dernière Mise à Jour** : 2025-11-29

### Progression Globale

- ✅ **Phase 1** : MVP (Core Features) - 100% Complete
- ✅ **Phase 2** : CI/CD & Qualité - 95% Complete (CD partiel)
- 🔜 **Phase 3** : Sécurité Avancée - Prochaine
- ⏳ **Phases 4-7** : En attente

---

## Phase 1 : MVP (Core Features) ✅ TERMINÉE

### 1.1 Gestion des Fichiers ✅

- [x] Upload de fichiers (drag & drop + sélection)
- [x] Support des gros fichiers (streaming/chunked upload)
- [x] Stockage local sur le serveur
- [x] Suppression automatique après expiration
- [x] Limite de taille configurable par fichier/upload

### 1.5 Partage de Fichiers Existants (Volume Mount) 🔄 70% Complete

- [x] Configuration d'un répertoire de partage (volume Docker)
- [x] Liste des fichiers disponibles dans le répertoire (API)
- [ ] Sélection de fichier(s) à partager (sans upload) - UI manquante
- [x] Génération de liens pour fichiers existants (API)
- [x] Isolation sécurisée (seuls les fichiers explicitement partagés sont accessibles)
- [x] Support de sous-répertoires (API implémentée)
- [x] Permissions de lecture seule sur le volume
- [x] Preview des fichiers disponibles (nom, taille, type) - API
- [x] Téléchargement de fichiers partagés (download handler mis à jour)
- [ ] Mode hybride : upload OU sélection de fichier existant - UI manquante
- [ ] Tests E2E pour shared volume
- [ ] Page UI de navigation /share-existing

### 1.6 Mode Shared-Only (Désactivation Upload) 🔜

- [ ] Variable d'environnement UPLOAD_ENABLED (default: true)
- [ ] Désactivation complète de l'upload côté serveur (sécurité)
- [ ] Endpoint API /api/upload refuse les requêtes (403 Forbidden)
- [ ] Page d'accueil cache la section upload si désactivé
- [ ] Redirection automatique vers /share-existing si upload disabled
- [ ] Message clair "Upload disabled - Share existing files only"
- [ ] Tests de sécurité : vérifier qu'upload est vraiment bloqué
- [ ] Documentation mode shared-only pour NAS/serveurs de fichiers

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

### 3.1 Authentification & Accès

- [ ] Protection par mot de passe optionnelle
- [ ] Code PIN à usage unique
- [ ] Limite du nombre de téléchargements (1x, 5x, illimité)
- [ ] Liste blanche d'adresses IP
- [ ] Authentification du destinataire par email/SMS (optionnel)

### 3.2 Chiffrement

- [ ] Chiffrement des fichiers au repos (AES-256)
- [ ] Chiffrement de bout en bout optionnel
- [ ] Gestion sécurisée des clés
- [ ] Déchiffrement côté client pour E2EE

### 3.3 Traçabilité

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
- ⏳ **Chiffrement**: À implémenter (Phase 3)
- ⏳ **Authentification**: À implémenter (Phase 3)

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

1. **MVP fonctionnel** (Phase 1) - ✅ TERMINÉ (2025-11-29)
2. **CI/CD & Qualité** (Phase 2) - ✅ TERMINÉ (2025-11-29)
3. **Sécurité Avancée** (Phase 3) - 1-2 semaines - 🔜 PROCHAINE
4. **UX Améliorée** (Phase 4) - 1-2 semaines
5. **Administration** (Phase 5) - 1 semaine
6. **API & Intégrations** (Phase 6) - 2 semaines
7. **Fonctionnalités Avancées** (Phase 7) - évolutif

---

## Métriques Actuelles (v0.4.0)

### Code

- **Fichiers source** : ~70 fichiers
- **Lignes de code** : ~12,000 lignes
- **Langage** : TypeScript + Svelte
- **Tests** : 16 tests unitaires + 3 tests E2E
- **Coverage** : ~3.42% (infrastructure en place, tests à écrire)

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
