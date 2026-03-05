# PrivaSend - Setup Guide

Guide de démarrage rapide pour développer et déployer PrivaSend.

## Installation Rapide

### Prérequis

- Node.js 18+ ou 20+
- npm, pnpm ou yarn
- (Optionnel) Docker pour le déploiement

### Étapes

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Configurer l'environnement**

   ```bash
   cp .env.example .env
   # Éditez .env si nécessaire
   ```

3. **Lancer en développement**

   ```bash
   npm run dev
   ```

4. **Ouvrir le navigateur**
   ```
   http://localhost:5173
   ```

## Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build pour production
npm run preview      # Prévisualiser le build
npm run check        # Vérification TypeScript
npm run check:watch  # Vérification en mode watch
```

## Configuration

Fichier `.env` :

```env
# Chemin de stockage des fichiers
STORAGE_PATH=./storage

# Taille maximale des fichiers (5GB par défaut)
MAX_FILE_SIZE=5368709120

# Taille des chunks pour l'upload (5MB)
CHUNK_SIZE=5242880

# Types MIME autorisés (vide = tous)
ALLOWED_MIME_TYPES=

# Durée de rétention par défaut (jours)
DEFAULT_EXPIRATION_DAYS=7

# Intervalle de nettoyage (heures)
CLEANUP_INTERVAL_HOURS=1
```

## Tests Manuels

### Test 1: Upload de petit fichier (< 10MB)

1. Créer un fichier test :

   ```bash
   dd if=/dev/zero of=test-small.bin bs=1M count=5
   ```

2. Uploader via l'interface web ou curl :

   ```bash
   curl -X POST http://localhost:5173/api/upload \
     -F "file=@test-small.bin"
   ```

3. Vérifier la réponse :
   ```json
   {
   	"success": true,
   	"fileId": "...",
   	"fileName": "test-small.bin",
   	"fileSize": 5242880,
   	"expiresAt": "..."
   }
   ```

### Test 2: Upload de gros fichier (> 10MB, chunked)

1. Créer un gros fichier :

   ```bash
   dd if=/dev/zero of=test-large.bin bs=1M count=100
   ```

2. Uploader via l'interface web (glisser-déposer)

3. Observer la barre de progression en temps réel

### Test 3: Vérifier le stockage

```bash
# Lister les fichiers stockés
ls -lh storage/

# Lister les métadonnées
ls -lh storage/metadata/

# Lire les métadonnées d'un fichier
cat storage/metadata/[FILE_ID].json
```

### Test 4: Tester le nettoyage automatique

1. Modifier `.env` pour tester rapidement :

   ```env
   DEFAULT_EXPIRATION_DAYS=0
   CLEANUP_INTERVAL_HOURS=0.01  # 36 secondes
   ```

2. Uploader un fichier

3. Attendre ~1 minute

4. Vérifier que le fichier est supprimé :
   ```bash
   ls storage/
   ```

## Déploiement

### Option 1: Docker Compose (Recommandé)

```bash
# Build et démarrage
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Option 2: Déploiement Direct

```bash
# Build
npm run build

# Lancer en production
NODE_ENV=production node build
```

### Option 3: VPC/Réseau Local avec Reverse Proxy

Avec Caddy :

```caddyfile
privasend.local {
    reverse_proxy localhost:3000
}
```

Avec Nginx :

```nginx
server {
    listen 443 ssl http2;
    server_name privasend.local;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Important pour les gros fichiers
        client_max_body_size 5G;
        proxy_request_buffering off;
    }
}
```

## Troubleshooting

### Erreur: "File too large"

- Augmenter `MAX_FILE_SIZE` dans `.env`
- Si derrière un reverse proxy, augmenter aussi la limite côté proxy

### Erreur: "ENOSPC: no space left on device"

- Vérifier l'espace disque :
  ```bash
  df -h
  ```
- Nettoyer manuellement :
  ```bash
  rm -rf storage/*
  ```

### Les fichiers ne se suppriment pas automatiquement

- Vérifier les logs du service de nettoyage
- Vérifier que `CLEANUP_INTERVAL_HOURS` est configuré
- Redémarrer l'application

### Upload lent

- Réduire `CHUNK_SIZE` pour un réseau lent
- Augmenter `CHUNK_SIZE` pour un réseau rapide
- Vérifier la bande passante réseau

## Structure des Données

### Fichier stocké

```
storage/
  ├── [fileId]                    # Le fichier binaire
  └── metadata/
      └── [fileId].json          # Métadonnées JSON
```

### Format des métadonnées

```json
{
	"id": "abc123...",
	"originalName": "document.pdf",
	"size": 1234567,
	"mimeType": "application/pdf",
	"uploadedAt": "2025-11-29T12:00:00.000Z",
	"expiresAt": "2025-12-06T12:00:00.000Z",
	"path": "/app/storage/abc123..."
}
```

## Monitoring

### Vérifier l'état du service

```bash
# Avec Docker
docker-compose ps

# Voir les logs
docker-compose logs -f privasend

# Stats d'utilisation
docker stats
```

### Métriques à surveiller

- **Espace disque** : `df -h storage/`
- **Nombre de fichiers** : `ls storage/ | wc -l`
- **Taille totale** : `du -sh storage/`

## Next Steps

Une fois Phase 1.1 fonctionnelle :

1. **Phase 1.2** : Génération de liens de téléchargement
2. **Phase 2** : Sécurité (authentification, chiffrement)
3. **Phase 3** : Interface utilisateur avancée

Voir [ROADMAP.md](ROADMAP.md) pour plus de détails.

## Support

Pour les questions ou problèmes :

- Consulter [README.md](README.md)
- Vérifier [ROADMAP.md](ROADMAP.md)
- Créer une issue GitHub (si applicable)

---

**Version**: Phase 1.1
**Date**: 2025-11-29
