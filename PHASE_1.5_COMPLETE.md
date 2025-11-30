# Phase 1.5 - Shared Volume File Sharing - STATUS

**Status**: 🔄 70% Complete (Backend Done)
**Date**: 2025-11-30

## Résumé

Phase 1.5 permet de partager des fichiers déjà présents sur le serveur (montés via volume Docker) sans avoir à les uploader.

## ✅ Implémenté (70%)

### Backend (100%)

**Configuration** (`src/lib/server/config.ts`):
- ✅ Section `sharedVolume` ajoutée
- ✅ 4 variables d'environnement
- ✅ Defaults sensibles (disabled, read-only, depth 10)

**Database** (`src/lib/server/database.ts`):
- ✅ Champ `sourceType`: 'upload' | 'shared'
- ✅ Champ `sharedPath`: string | null
- ✅ Index sur `sourceType`
- ✅ Backward compatible (default 'upload')

**SharedVolumeService** (`src/lib/server/sharedvolume.ts`):
- ✅ Path validation avec protection traversal
- ✅ `listFiles()`: Browse directories
- ✅ `getFileInfo()`: File metadata
- ✅ MIME type detection (20+ types)
- ✅ Hidden file filtering
- ✅ Depth limiting
- ✅ Security: Rejects `..`, validates boundaries

**API Endpoints**:
- ✅ `GET /api/shared/browse?path=xxx`: Liste fichiers
- ✅ `POST /api/shared/link`: Crée share link
- ✅ Download handler mis à jour: Support sourceType

### Configuration Docker

**docker-compose.yml** (example):

```yaml
services:
  privasend:
    volumes:
      - ./storage:/app/storage        # Uploads
      - ./shared-files:/app/shared:ro # Shared volume (read-only)
    environment:
      - SHARED_VOLUME_ENABLED=true
      - SHARED_VOLUME_PATH=/app/shared
```

### Usage Example

```bash
# 1. Créer répertoire partagé
mkdir -p /srv/shared-files
cp important.pdf /srv/shared-files/

# 2. Lancer avec volume
docker-compose up -d

# 3. API pour browser
curl http://localhost:3000/api/shared/browse

# 4. API pour créer lien
curl -X POST http://localhost:3000/api/shared/link \
  -H "Content-Type: application/json" \
  -d '{"relativePath": "important.pdf"}'

# 5. Télécharger via lien
curl http://localhost:3000/download/[token]
```

## ⏳ Reste à Faire (30%)

### Frontend UI

**Page `/share-existing`** (à créer):
- Liste des fichiers du volume
- Navigation dans sous-répertoires
- Bouton "Share" par fichier
- Génération et affichage du lien
- Copie dans presse-papier

**Intégration dans page principale**:
- Toggle "Upload file" vs "Share existing file"
- Navigation entre les deux modes

### Tests

**Tests E2E** (à ajouter):
- Browse shared volume
- Create share link
- Download shared file
- Path traversal attempts

**Tests d'intégration** (à ajouter):
- API browse avec filesystem réel
- API link creation
- Download flow complet

## 🔒 Sécurité

### Protections Implémentées ✅

1. **Path Traversal**:
   - Reject `..` dans paths
   - Validation `startsWith(basePath)`
   - Normalization avec `path.normalize()`

2. **Liste Blanche**:
   - Seuls fichiers explicitement partagés accessibles
   - Pas d'accès automatique au volume entier

3. **Read-Only**:
   - Volume monté en lecture seule par défaut
   - Configuration `SHARED_VOLUME_READ_ONLY`

4. **Depth Limiting**:
   - `MAX_DEPTH` configurable (default 10)
   - Empêche parcours excessif

5. **Hidden Files**:
   - Dotfiles exclus automatiquement
   - Protection fichiers système

## 📝 Fichiers Créés/Modifiés

### Créés (Step 1-2):
- `src/lib/server/sharedvolume.ts` (165 lines)
- `src/routes/api/shared/browse/+server.ts` (33 lines)
- `src/routes/api/shared/link/+server.ts` (88 lines)
- `PHASE_1.5_SHARED_VOLUME_SPEC.md` (spec complète)
- `PHASE_1.5_STEP2_TODO.md` (TODO list)

### Modifiés:
- `src/lib/server/config.ts` (added sharedVolume)
- `src/lib/server/database.ts` (added sourceType, sharedPath)
- `src/routes/download/[token]/+server.ts` (handle shared files)
- `.env.example` (shared volume vars)
- `ROADMAP.md` (Phase 1.5 added)
- `PROJECT_STATUS.md` (updated status)

## 🎯 Prochaines Étapes

### Pour Compléter Phase 1.5 (30% restant)

**Step 3 - Frontend UI**:
1. Créer page `/share-existing`
2. Composant file browser
3. Intégration mode hybride
4. Tests E2E

**Estimation**: 4-6 heures

### Bénéfices de la Fonctionnalité

✅ **Pas de transfert réseau** (fichier déjà sur serveur)
✅ **Pas de limite de taille** (pas d'upload)
✅ **Rapide** (juste création de lien)
✅ **Économie stockage** (pas de duplication)
✅ **Parfait pour VPC/NAS** (infrastructure interne)

## 📊 Cas d'Usage

1. **Serveur de Builds**: Partager artifacts sans upload
2. **NAS/Stockage**: Distribuer fichiers volumineux
3. **VPC Interne**: Partage rapide entre services
4. **Backup Distribution**: Distribuer sauvegardes

## 🔐 Configuration Recommandée

```env
SHARED_VOLUME_ENABLED=true
SHARED_VOLUME_PATH=/mnt/nas/shared
SHARED_VOLUME_READ_ONLY=true
SHARED_VOLUME_MAX_DEPTH=5
```

---

**Backend 100% Fonctionnel** ✅
**Frontend à implémenter** ⏳
**Tests à ajouter** ⏳

Phase 1.5 transforme PrivaSend en solution hybride : Upload ET Share existing files !
