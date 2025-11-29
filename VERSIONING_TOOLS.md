# Outils de Versioning Automatique pour PrivaSend

## Solutions Populaires

### 1. **semantic-release** ⭐ RECOMMANDÉ

Le plus populaire et le plus complet.

#### Installation

```bash
npm install --save-dev semantic-release @semantic-release/git @semantic-release/changelog
```

#### Configuration

**`.releaserc.json`:**

```json
{
  "branches": ["master"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

#### Workflow GitHub Actions

**`.github/workflows/release.yml`:**

```yaml
name: Release

on:
  push:
    branches: [master]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release
```

#### Conventional Commits Requis

```bash
# Format: <type>(<scope>): <description>

feat: Add password protection for links          # → MINOR bump
fix: Correct file upload timeout                 # → PATCH bump
feat!: Change API response format                # → MAJOR bump
docs: Update README                              # → No version bump
chore: Update dependencies                       # → No version bump

# Breaking change alternative
feat: Add new auth system

BREAKING CHANGE: Old auth tokens no longer valid
```

#### Avantages
- ✅ 100% automatique
- ✅ CHANGELOG généré automatiquement
- ✅ GitHub Release créée automatiquement
- ✅ Tags Git automatiques
- ✅ Détection smart du type de version
- ✅ Support monorepo

#### Inconvénients
- ⚠️ Nécessite Conventional Commits strict
- ⚠️ Courbe d'apprentissage

---

### 2. **release-please** (Google)

Alternative plus simple de Google.

#### Installation

Pas d'installation npm, juste GitHub Action:

**`.github/workflows/release-please.yml`:**

```yaml
name: Release Please

on:
  push:
    branches: [master]

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        with:
          release-type: node
          package-name: privasend
```

#### Avantages
- ✅ Très simple à setup
- ✅ Crée PR de release automatiquement
- ✅ CHANGELOG généré
- ✅ Pas de dépendances npm

#### Inconvénients
- ⚠️ Moins de plugins
- ⚠️ Moins customizable

---

### 3. **standard-version** (Deprecated mais encore utilisé)

Ancien standard, maintenant remplacé par semantic-release.

```bash
npm install --save-dev standard-version
```

**package.json:**

```json
{
  "scripts": {
    "release": "standard-version"
  }
}
```

Usage:
```bash
npm run release        # Auto-détecte version
npm run release -- --release-as minor
```

⚠️ **Note**: Projet deprecated, utiliser semantic-release à la place.

---

### 4. **commit-and-tag-version** (Fork de standard-version)

Fork actif de standard-version.

```bash
npm install --save-dev commit-and-tag-version
```

**package.json:**

```json
{
  "scripts": {
    "release": "commit-and-tag-version"
  }
}
```

Usage identique à standard-version.

---

### 5. **changesets** (Monorepo focus)

Excellent pour monorepos, mais overkill pour projet simple.

```bash
npm install --save-dev @changesets/cli
npx changeset init
```

#### Avantages
- ✅ Parfait pour monorepos
- ✅ Gestion de multiples packages
- ✅ PR-based workflow

#### Inconvénients
- ⚠️ Complexe pour projet simple
- ⚠️ Workflow manuel (créer changesets)

---

## Recommandation pour PrivaSend

### Option A: **semantic-release** (100% Auto) ⭐

**Pour qui**: Équipes qui veulent 100% automatisation

**Setup complet:**

```bash
# 1. Install
npm install --save-dev \
  semantic-release \
  @semantic-release/changelog \
  @semantic-release/git \
  @semantic-release/github

# 2. Configure .releaserc.json (voir ci-dessus)

# 3. Adopter Conventional Commits
git commit -m "feat: Add new feature"
git commit -m "fix: Correct bug"

# 4. Push → release automatique !
git push origin master
```

**Résultat**: Sur chaque push master avec commits feat/fix, nouvelle version automatique !

---

### Option B: **release-please** (Semi-Auto) ⭐⭐

**Pour qui**: Veulent simplicité et contrôle via PR

**Setup:**

Juste ajouter le workflow (voir ci-dessus), c'est tout !

**Workflow:**
1. Commits avec Conventional Commits
2. Push sur master
3. Bot crée PR "chore: release v1.2.0"
4. Review PR
5. Merge PR → Release créée !

**Résultat**: Contrôle humain sur les releases, mais changelog auto.

---

### Option C: **Script Manuel** (Contrôle Total) ⭐⭐⭐ ACTUEL

**Pour qui**: Veulent contrôle total

**Actuel**: `scripts/release.sh`

```bash
./scripts/release.sh minor
git push origin master --tags
```

**Avantages:**
- ✅ Contrôle total
- ✅ Pas de dépendances
- ✅ Simple à comprendre
- ✅ Flexible

**Inconvénients:**
- ⚠️ CHANGELOG manuel
- ⚠️ Commits non standardisés OK

---

## Ma Recommandation Finale

### Pour PrivaSend: **release-please** + Script Manuel

**Pourquoi:**
1. Projet solo/petit équipe → pas besoin de 100% auto
2. release-please simple et sans deps npm
3. Script manuel comme backup/override

**Setup Hybride:**

```yaml
# .github/workflows/release-please.yml
name: Release Please

on:
  push:
    branches: [master]

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        id: release
        with:
          release-type: node
          package-name: privasend

      # Si release créée, trigger Docker build
      - name: Trigger Docker Build
        if: ${{ steps.release.outputs.release_created }}
        run: |
          echo "Release ${{ steps.release.outputs.tag_name }} created"
```

**Workflow:**
- Commits normaux → release-please surveille
- Quand prêt → Merge PR auto-générée
- Urgence → `./scripts/release.sh patch && git push --tags`

---

## Conventional Commits Cheatsheet

```bash
# Features (MINOR bump)
feat: Add password protection
feat(upload): Support drag and drop folders

# Fixes (PATCH bump)
fix: Correct file size calculation
fix(download): Handle network interruption

# Breaking changes (MAJOR bump)
feat!: Change API response format
fix!: Remove deprecated endpoints

# No version bump
docs: Update README
chore: Update dependencies
style: Format code
refactor: Restructure storage service
test: Add unit tests
ci: Update GitHub Actions
```

---

## Comparaison Rapide

| Tool | Auto | Deps | Conventional Commits | Complexité | Best For |
|------|------|------|---------------------|-----------|----------|
| **semantic-release** | 100% | Oui | Requis | Moyenne | Équipes, CI/CD strict |
| **release-please** | PR-based | Non | Recommandé | Faible | Projets GitHub, contrôle |
| **changesets** | PR-based | Oui | Non | Élevée | Monorepos |
| **Script manuel** | 0% | Non | Non | Faible | Flexibilité maximale |

---

## Implémentation Suggérée

Voulez-vous que j'implémente **release-please** pour PrivaSend ?

Cela ajouterait:
- 1 fichier: `.github/workflows/release-please.yml`
- Changelog automatique
- GitHub Releases automatiques
- Garde le script manuel comme backup

Ou préférez-vous garder le système manuel actuel (scripts/release.sh) ?
