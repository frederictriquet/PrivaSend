# Phase 1.5 - Partage de Fichiers Existants (Shared Volume)

**Status**: PLANIFICATION
**Priorité**: Moyenne
**Complexité**: Moyenne

## Vue d'ensemble

Permettre de partager des fichiers déjà présents sur le serveur (dans un volume Docker monté) sans avoir besoin de les uploader. Utile pour :

- Partager des builds/artifacts déjà sur le serveur
- Distribuer des fichiers volumineux déjà présents
- Éviter l'upload réseau pour fichiers locaux au serveur
- Cas d'usage VPC/réseau local optimisé

## Cas d'Usage

### Scénario 1 : Serveur de Builds

```
/shared-files/
├── app-v1.2.0.zip
├── app-v1.2.1.zip
├── database-backup.sql
└── docs/
    └── manual.pdf
```

Admin sélectionne `app-v1.2.1.zip` → Génère lien → Envoie aux clients

### Scénario 2 : VPC avec Stockage Centralisé

NAS/stockage monté en `/mnt/nas` → PrivaSend browse → Sélectionne fichiers → Partage

## Architecture

### Configuration

**`.env`** :

```env
# Shared volume configuration
SHARED_VOLUME_ENABLED=true
SHARED_VOLUME_PATH=/app/shared-files
SHARED_VOLUME_READ_ONLY=true
SHARED_VOLUME_MAX_DEPTH=3  # Profondeur max sous-répertoires
```

**`docker-compose.yml`** :

```yaml
services:
  privasend:
    volumes:
      - ./storage:/app/storage  # Uploads
      - ./shared-files:/app/shared-files:ro  # Read-only shared volume
```

### Database Schema Extension

Ajouter champ à `share_links` :

```sql
ALTER TABLE share_links ADD COLUMN sourceType TEXT DEFAULT 'upload';
-- Values: 'upload' (fichier uploadé) | 'shared' (fichier du volume)

ALTER TABLE share_links ADD COLUMN sharedPath TEXT;
-- Path relatif dans le shared volume (si sourceType='shared')
```

### Backend

**`src/lib/server/sharedvolume.ts`** :

```typescript
import fs from 'fs/promises';
import path from 'path';
import { config } from './config';

export class SharedVolumeService {
  private basePath: string;
  private enabled: boolean;

  constructor() {
    this.basePath = config.sharedVolume.path;
    this.enabled = config.sharedVolume.enabled;
  }

  /**
   * List files in shared volume
   */
  async listFiles(relativePath: string = ''): Promise<FileEntry[]> {
    if (!this.enabled) throw new Error('Shared volume not enabled');

    const fullPath = this.resolvePath(relativePath);

    // Security: Ensure path is within basePath
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('Path traversal detected');
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files: FileEntry[] = [];

    for (const entry of entries) {
      const stats = await fs.stat(path.join(fullPath, entry.name));
      files.push({
        name: entry.name,
        path: path.relative(this.basePath, path.join(fullPath, entry.name)),
        isDirectory: entry.isDirectory(),
        size: stats.size,
        mtime: stats.mtime
      });
    }

    return files;
  }

  /**
   * Get file metadata from shared volume
   */
  async getFileInfo(relativePath: string): Promise<FileInfo> {
    const fullPath = this.resolvePath(relativePath);

    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('Path traversal detected');
    }

    const stats = await fs.stat(fullPath);

    return {
      name: path.basename(fullPath),
      path: relativePath,
      size: stats.size,
      mtime: stats.mtime,
      isFile: stats.isFile()
    };
  }

  /**
   * Create share link for existing file
   */
  async createShareLinkForSharedFile(
    relativePath: string,
    token: string
  ): Promise<ShareLink> {
    const fileInfo = await this.getFileInfo(relativePath);

    if (!fileInfo.isFile) {
      throw new Error('Only files can be shared');
    }

    // Store in database with sourceType='shared'
    return database.createShareLink(token, relativePath, {
      sourceType: 'shared',
      sharedPath: relativePath
    });
  }

  /**
   * Resolve and validate path
   */
  private resolvePath(relativePath: string): string {
    const resolved = path.resolve(this.basePath, relativePath);

    // Security check
    if (!resolved.startsWith(this.basePath)) {
      throw new Error('Invalid path');
    }

    return resolved;
  }
}

export const sharedVolume = new SharedVolumeService();
```

### API Endpoints

**`GET /api/shared/files`** - Liste les fichiers disponibles

```typescript
// src/routes/api/shared/files/+server.ts
export const GET: RequestHandler = async ({ url }) => {
  const path = url.searchParams.get('path') || '';

  const files = await sharedVolume.listFiles(path);

  return json({
    files,
    path: path || '/',
    enabled: config.sharedVolume.enabled
  });
};
```

**`POST /api/shared/share`** - Crée un lien pour un fichier existant

```typescript
// src/routes/api/shared/share/+server.ts
export const POST: RequestHandler = async ({ request }) => {
  const { filePath } = await request.json();

  const token = nanoid(32);
  const shareLink = await sharedVolume.createShareLinkForSharedFile(
    filePath,
    token
  );

  return json({ shareLink });
};
```

### Frontend

**Nouvelle page** : `/share-existing`

```svelte
<!-- src/routes/share-existing/+page.svelte -->
<script lang="ts">
  let files = $state([]);
  let currentPath = $state('');
  let selectedFile = $state(null);

  async function loadFiles(path = '') {
    const res = await fetch(`/api/shared/files?path=${path}`);
    const data = await res.json();
    files = data.files;
    currentPath = data.path;
  }

  async function shareFile(file) {
    const res = await fetch('/api/shared/share', {
      method: 'POST',
      body: JSON.stringify({ filePath: file.path })
    });
    const data = await res.json();
    // Show share link
  }
</script>

<main>
  <h1>Share Existing Files</h1>

  <div class="file-browser">
    {#each files as file}
      <div class="file-item">
        <span>{file.isDirectory ? '📁' : '📄'} {file.name}</span>
        <span>{formatBytes(file.size)}</span>
        {#if !file.isDirectory}
          <button onclick={() => shareFile(file)}>
            Share this file
          </button>
        {:else}
          <button onclick={() => loadFiles(file.path)}>
            Open folder
          </button>
        {/if}
      </div>
    {/each}
  </div>
</main>
```

**Navigation** : Ajouter dans page principale

```svelte
<nav>
  <a href="/">Upload File</a>
  <a href="/share-existing">Share Existing File</a>
</nav>
```

## Sécurité

### Protections Critiques

1. **Path Traversal Protection**
   - Validation stricte des chemins
   - Tous les paths résolus doivent rester dans `SHARED_VOLUME_PATH`
   - Interdiction de `../`, chemins absolus, symlinks

2. **Liste Blanche Implicite**
   - Seuls les fichiers **explicitement sélectionnés** sont partagés
   - Pas d'accès aux autres fichiers du volume
   - Pas de listing automatique via download link

3. **Read-Only Volume**
   - Volume monté en lecture seule (`:ro`)
   - Aucune modification possible
   - Aucune suppression

4. **Permissions**
   - Vérifier permissions filesystem
   - Rejeter fichiers non lisibles
   - Log des accès

### Code de Sécurité

```typescript
// Validation stricte
function validatePath(userPath: string, basePath: string): string {
  // Normaliser le path
  const normalized = path.normalize(userPath);

  // Interdire path traversal
  if (normalized.includes('..')) {
    throw new Error('Path traversal not allowed');
  }

  // Résoudre le path complet
  const resolved = path.resolve(basePath, normalized);

  // Vérifier qu'on reste dans basePath
  if (!resolved.startsWith(basePath)) {
    throw new Error('Access denied: outside shared volume');
  }

  return resolved;
}
```

## Configuration Docker

### docker-compose.yml

```yaml
services:
  privasend:
    image: ghcr.io/frederictriquet/privasend:latest
    ports:
      - "3000:3000"
    volumes:
      # Storage normal (uploads)
      - ./storage:/app/storage

      # Volume partagé (read-only) - NOUVEAU
      - /path/to/shared/files:/app/shared-files:ro

    environment:
      - SHARED_VOLUME_ENABLED=true
      - SHARED_VOLUME_PATH=/app/shared-files
      - SHARED_VOLUME_READ_ONLY=true
```

### Exemple d'utilisation

```bash
# Préparer répertoire de fichiers à partager
mkdir -p /srv/builds
cp app-v1.0.0.zip /srv/builds/

# Lancer PrivaSend avec volume
docker-compose up -d

# Dans l'interface web:
# 1. Aller sur "Share Existing Files"
# 2. Browser /srv/builds
# 3. Cliquer "Share" sur app-v1.0.0.zip
# 4. Copier le lien généré
```

## Différences Upload vs Shared

| Feature | Upload | Shared Volume |
|---------|--------|---------------|
| Source | Client upload | Fichier serveur |
| Network | Oui (upload) | Non |
| Storage | Dupliqué dans storage/ | Référence (symlink ou path) |
| Expiration | Fichier supprimé | Lien expire, fichier reste |
| Taille limite | 5GB (config) | Illimitée (déjà sur serveur) |
| Modification | Immutable | Immutable (read-only) |

## Base de Données

### Extension du schema

```typescript
interface ShareLink {
  // ... existing fields
  sourceType: 'upload' | 'shared';  // Type de source
  sharedPath: string | null;        // Path si sourceType='shared'
}
```

### Métadonnées

Pour fichiers partagés, stocker :

```json
{
  "linkId": "abc123",
  "sourceType": "shared",
  "sharedPath": "builds/app-v1.0.0.zip",
  "fileName": "app-v1.0.0.zip",
  "fileSize": 52428800,
  "createdAt": "2025-11-30T12:00:00Z",
  "expiresAt": "2025-12-07T12:00:00Z"
}
```

## Download Handler Update

Modifier `/download/[token]` pour gérer les 2 sources :

```typescript
const link = database.getShareLink(token);

if (link.sourceType === 'upload') {
  // Logique actuelle (fichier dans storage/)
  const filePath = path.join(config.storage.path, link.fileId);
  // ...
} else if (link.sourceType === 'shared') {
  // Nouveau: fichier dans shared volume
  const filePath = path.join(config.sharedVolume.path, link.sharedPath);

  // Security check
  if (!filePath.startsWith(config.sharedVolume.path)) {
    throw error(403, 'Access denied');
  }

  // Stream file
  // ...
}
```

## UI/UX

### Page "Share Existing Files"

```
┌─────────────────────────────────────┐
│  PrivaSend - Share Existing Files  │
├─────────────────────────────────────┤
│                                     │
│  📁 Current: /shared-files          │
│  ← Back to root                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📁 builds/         [Open]   │   │
│  │ 📁 docs/           [Open]   │   │
│  │ 📄 README.md       [Share]  │   │
│  │    125 KB                    │   │
│  │ 📄 app-v1.0.0.zip  [Share]  │   │
│  │    50 MB                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Or: [Upload a new file instead]   │
└─────────────────────────────────────┘
```

## Considérations

### Avantages

✅ Pas de transfert réseau (fichier déjà sur serveur)
✅ Supporte fichiers très volumineux (pas de limite upload)
✅ Utile pour VPC/infrastructure interne
✅ Économie de stockage (pas de duplication)
✅ Rapide (juste création de lien)

### Inconvénients

⚠️ Complexité accrue (2 sources de fichiers)
⚠️ Nécessite configuration Docker
⚠️ Gestion des permissions filesystem
⚠️ Fichier peut être modifié/supprimé en dehors de PrivaSend

### Sécurité

🔒 **Critique** : Path traversal protection
🔒 **Important** : Liste blanche (pas de listing automatique)
🔒 **Important** : Read-only volume
🔒 **Moyen** : Validation taille/type fichiers

## Implémentation

### Étape 1 : Backend

1. Créer `SharedVolumeService`
2. Ajouter config `sharedVolume`
3. Étendre schema database
4. Créer API endpoints

### Étape 2 : Frontend

1. Page de navigation/browser
2. Sélection de fichiers
3. Génération de liens
4. UI pour mode hybride

### Étape 3 : Download

1. Modifier handler download
2. Support des 2 sources
3. Même sécurité (rate limit, etc.)

### Étape 4 : Tests

1. Tests unitaires (path validation)
2. Tests d'intégration
3. Tests E2E (browse + share)

## Temps Estimé

- Backend : 3-4 heures
- Frontend : 2-3 heures
- Tests : 2 heures
- Documentation : 1 heure

**Total** : 8-10 heures

## Alternatives Considérées

### Alternative 1 : Symlinks

Créer symlinks dans storage/ vers shared volume

**Rejeté** : Complexité, problèmes cross-platform

### Alternative 2 : File Registry

Base de données des fichiers partagés disponibles

**Possible** : Pourrait compléter la solution

### Alternative 3 : S3-Compatible

Utiliser MinIO/S3 comme source

**Future** : Phase 6 (intégrations)

## Dépendances

- Phase 1.1-1.4 : ✅ Complètes
- Phase 2 : ✅ CI/CD en place
- Phase 3.1 : ⏳ Auth recommandée (contrôler qui peut browser)

## Priorité

**Moyenne** - Utile mais pas critique

Implémenter **après** :

1. Phase 3.1 (Auth) - Pour contrôler l'accès au browser
2. Ou en mode "admin only" avec auth basique

## Configuration Exemple

### Setup Complet

```bash
# 1. Créer répertoire partagé
mkdir -p /srv/privasend-shared
chmod 755 /srv/privasend-shared

# 2. Ajouter fichiers
cp important-file.zip /srv/privasend-shared/

# 3. Configurer docker-compose.yml
# (voir ci-dessus)

# 4. Lancer
docker-compose up -d

# 5. Accéder /share-existing dans l'UI
```

---

**Note** : Cette fonctionnalité transforme PrivaSend en "file server with shareable links" pour fichiers existants, complétant le cas d'usage "WeTransfer" avec un cas "Dropbox public links".
