# Deploying PrivaSend with HTTPS

Guide pour déployer PrivaSend avec HTTPS automatique via https-portal.

## Configuration Rapide

### 1. Fichier docker-compose.https.yml

Utiliser `docker-compose.https.yml` qui configure :

- **PrivaSend** : Application sur port 3000 (interne)
- **https-portal** : Reverse proxy avec Let's Encrypt automatique
- Ports exposés : 80 (HTTP redirect) et 443 (HTTPS)

### 2. Configuration du Domaine

Modifier dans `docker-compose.https.yml` :

```yaml
DOMAINS: 'votre-domaine.com -> http://privasend:3000'
```

Exemples :

```yaml
# Un seul domaine
DOMAINS: 'privasend.example.com -> http://privasend:3000'

# Plusieurs domaines
DOMAINS: 'privasend.example.com -> http://privasend:3000, files.example.com -> http://privasend:3000'

# Avec www
DOMAINS: 'privasend.example.com -> http://privasend:3000, www.privasend.example.com -> http://privasend:3000'
```

### 3. Choisir le Mode SSL

#### Development (Local Testing)

```yaml
STAGE: 'local'
```

- Génère certificats auto-signés
- Pas besoin de domaine réel
- Warning SSL dans le navigateur (normal)

#### Staging (Testing Let's Encrypt)

```yaml
STAGE: 'staging'
```

- Utilise Let's Encrypt Staging API
- Certificats de test (pas de limite de rate)
- Vérifie que tout fonctionne avant production

#### Production (Real Certificates)

```yaml
STAGE: 'production'
```

- Certificats Let's Encrypt réels
- Limite de rate : 50 certificats/semaine par domaine
- DNS doit pointer vers votre serveur

## Étapes de Déploiement

### Prérequis

1. **Serveur** avec Docker et Docker Compose
2. **Domaine** pointant vers l'IP du serveur (pour production/staging)
3. **Ports ouverts** : 80 et 443

### 1. Préparer le Serveur

```bash
# Clone le repository
git clone https://github.com/frederictriquet/PrivaSend.git
cd PrivaSend

# Créer répertoire storage
mkdir -p storage shared

# Optionnel : Créer répertoire partagé
mkdir -p /srv/shared-files
```

### 2. Configurer le Domaine

```bash
# Éditer docker-compose.https.yml
nano docker-compose.https.yml

# Remplacer 'privasend.example.com' par votre domaine
DOMAINS: 'votre-domaine.com -> http://privasend:3000'

# Choisir le STAGE
STAGE: 'production'  # ou 'staging' pour tester
```

### 3. Lancer

```bash
# Build et start
docker-compose -f docker-compose.https.yml up -d

# Voir les logs
docker-compose -f docker-compose.https.yml logs -f

# Vérifier le statut
docker-compose -f docker-compose.https.yml ps
```

### 4. Vérifier

```bash
# Test HTTP (doit rediriger vers HTTPS)
curl -I http://votre-domaine.com

# Test HTTPS
curl -I https://votre-domaine.com

# Ou dans le navigateur
https://votre-domaine.com
```

## Configuration Avancée

### Upload de Gros Fichiers

Pour supporter uploads > 1MB, ajouter :

```yaml
https-portal:
  environment:
    CLIENT_MAX_BODY_SIZE: '5G' # Match MAX_FILE_SIZE
```

### Custom Nginx Config

Créer `nginx-custom.conf` :

```nginx
client_max_body_size 5G;
proxy_request_buffering off;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
```

Monter dans https-portal :

```yaml
https-portal:
  volumes:
    - ./nginx-custom.conf:/var/lib/nginx-conf/privasend.example.com.conf.erb:ro
```

### Shared Volume en Production

```yaml
privasend:
  volumes:
    - ./storage:/app/storage
    - /mnt/nas/shared:/app/shared:ro # NAS monté en lecture seule
  environment:
    - SHARED_VOLUME_ENABLED=true
    - SHARED_VOLUME_PATH=/app/shared
```

### Forcer Renouvellement Certificat

```yaml
https-portal:
  environment:
    FORCE_RENEW: 'true'
```

Puis restart :

```bash
docker-compose -f docker-compose.https.yml down
docker-compose -f docker-compose.https.yml up -d
```

## Troubleshooting

### Certificat Non Généré

**Problème** : https-portal ne génère pas de certificat

**Solutions** :

1. Vérifier DNS :

   ```bash
   dig votre-domaine.com
   nslookup votre-domaine.com
   ```

2. Vérifier ports :

   ```bash
   netstat -tulpn | grep -E ':(80|443)'
   ```

3. Voir logs :
   ```bash
   docker-compose -f docker-compose.https.yml logs https-portal
   ```

### Rate Limit Let's Encrypt

**Problème** : "too many certificates already issued"

**Solutions** :

1. Utiliser STAGE: 'staging' pour tester
2. Attendre 1 semaine (limite : 50 certs/semaine)
3. Utiliser différent sous-domaine

### Upload Échoue (413 Request Entity Too Large)

**Problème** : Upload > 1MB échoue

**Solution** : Ajouter CLIENT_MAX_BODY_SIZE :

```yaml
https-portal:
  environment:
    CLIENT_MAX_BODY_SIZE: '5G'
```

### Connection Timeout

**Problème** : Timeout lors de gros uploads

**Solution** : Augmenter timeouts :

```yaml
privasend:
  environment:
    - REQUEST_TIMEOUT=300000 # 5 minutes
```

## Configuration DNS

### Exemple avec Cloudflare

1. Ajouter A record :

   ```
   Type: A
   Name: privasend (ou @)
   Content: [IP du serveur]
   Proxy: Désactivé (orange cloud off)
   ```

2. Attendre propagation DNS (5-30 minutes)

3. Lancer docker-compose

### Exemple avec OVH/Gandi

1. Ajouter enregistrement A :

   ```
   privasend.example.com. IN A [IP serveur]
   ```

2. TTL : 300 (5 minutes)

3. Attendre propagation

## Monitoring

### Vérifier Certificats

```bash
# Voir expiration
echo | openssl s_client -servername votre-domaine.com -connect votre-domaine.com:443 2>/dev/null | openssl x509 -noout -dates

# Vérifier émetteur
echo | openssl s_client -servername votre-domaine.com -connect votre-domaine.com:443 2>/dev/null | openssl x509 -noout -issuer
```

### Logs

```bash
# Logs PrivaSend
docker-compose -f docker-compose.https.yml logs -f privasend

# Logs https-portal
docker-compose -f docker-compose.https.yml logs -f https-portal

# Tous les logs
docker-compose -f docker-compose.https.yml logs -f
```

### Renouvellement Auto

https-portal renouvelle automatiquement les certificats 30 jours avant expiration.

Vérifier dans les logs :

```
https-portal | Renewing certificate for privasend.example.com
```

## Sécurité

### Recommandations

1. **Firewall** : Ouvrir seulement 80, 443

   ```bash
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

2. **Fail2ban** : Protéger contre brute force (optionnel)

3. **Rate Limiting** : Déjà implémenté dans PrivaSend

4. **Backup** : Sauvegarder régulièrement

   ```bash
   # Backup storage et database
   tar -czf backup-$(date +%Y%m%d).tar.gz storage/
   ```

5. **Updates** : Mettre à jour régulièrement
   ```bash
   docker-compose -f docker-compose.https.yml pull
   docker-compose -f docker-compose.https.yml up -d
   ```

## Production Checklist

Avant de mettre en production :

- [ ] DNS configuré et propagé
- [ ] Firewall configuré (ports 80, 443)
- [ ] STAGE: 'production' dans docker-compose.https.yml
- [ ] DOMAINS configuré avec vrai domaine
- [ ] Storage volume configuré
- [ ] Backup strategy en place
- [ ] Monitoring configuré
- [ ] Test upload/download
- [ ] Vérifier certificat SSL

## Commandes Utiles

```bash
# Start
docker-compose -f docker-compose.https.yml up -d

# Stop
docker-compose -f docker-compose.https.yml down

# Restart
docker-compose -f docker-compose.https.yml restart

# Rebuild
docker-compose -f docker-compose.https.yml build --no-cache
docker-compose -f docker-compose.https.yml up -d

# Logs en temps réel
docker-compose -f docker-compose.https.yml logs -f

# Status
docker-compose -f docker-compose.https.yml ps

# Cleanup
docker-compose -f docker-compose.https.yml down -v
```

## Support Multi-Domaines

Pour plusieurs domaines/sous-domaines :

```yaml
https-portal:
  environment:
    DOMAINS: |
      privasend.example.com -> http://privasend:3000
      files.example.com -> http://privasend:3000
      share.example.com -> http://privasend:3000
    STAGE: 'production'
```

Chaque domaine aura son propre certificat SSL.

---

**Documentation officielle https-portal** : https://github.com/SteveLTN/https-portal
