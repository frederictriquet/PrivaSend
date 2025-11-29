# Release Please - Setup & Usage

**Status**: ✅ CONFIGURED
**Version actuelle**: v0.4.0

## Ce qui a été configuré

### 1. Workflow GitHub Actions

**Fichier**: `.github/workflows/release-please.yml`

- ✅ Déclenché sur chaque push master
- ✅ Analyse les Conventional Commits
- ✅ Crée PR de release automatiquement
- ✅ Met à jour CHANGELOG.md
- ✅ Met à jour package.json version
- ✅ Crée GitHub Release avec tag

### 2. Configuration

**`.release-please-manifest.json`**:

```json
{
	".": "0.4.0"
}
```

**`release-please-config.json`**:

- Type: node
- Package: privasend
- Changelog: CHANGELOG.md
- Extra files: package.json

### 3. Documentation

- ✅ [CONTRIBUTING.md](CONTRIBUTING.md) - Guide de contribution
- ✅ [.github/COMMIT_CONVENTION.md](.github/COMMIT_CONVENTION.md) - Guide commits
- ✅ [VERSIONING.md](VERSIONING.md) - Stratégie versioning
- ✅ [CHANGELOG.md](CHANGELOG.md) - Historique versions

## Comment Utiliser

### Workflow Normal

#### 1. Développement

Travaillez normalement, mais utilisez Conventional Commits:

```bash
git commit -m "feat: Add password protection"
git commit -m "fix: Correct upload timeout"
git push origin master
```

#### 2. Release-Please Action

Après push sur master, release-please:

- Analyse les commits depuis dernière release
- Détermine le type de version bump
- Crée/Met à jour une PR de release

#### 3. PR de Release

Une PR sera créée automatiquement:

```
Title: chore: release 0.5.0

Changes:
- CHANGELOG.md updated
- package.json version: 0.4.0 → 0.5.0

Commits inclus:
- feat: Add password protection
- fix: Correct upload timeout
```

#### 4. Review & Merge

1. Reviewez la PR
2. Vérifiez CHANGELOG.md
3. Vérifiez version bump correcte
4. **Mergez la PR**

#### 5. Automatique

Dès le merge:

- ✅ Tag `v0.5.0` créé
- ✅ GitHub Release créée avec notes
- ✅ Docker workflow triggered
- ✅ Image `ghcr.io/.../privasend:v0.5.0` publiée

### Exemple Concret

```bash
# Lundi: Nouvelle feature
git commit -m "feat(admin): Add dashboard page"
git push origin master

# → release-please crée PR "chore: release 0.5.0"

# Mardi: Bug fix
git commit -m "fix(dashboard): Correct display bug"
git push origin master

# → release-please MET À JOUR la PR (toujours 0.5.0)

# Mercredi: Autre feature
git commit -m "feat(admin): Add user list"
git push origin master

# → release-please MET À JOUR la PR (toujours 0.5.0)

# Jeudi: Review et merge PR
# → v0.5.0 released automatiquement!
```

## Types de Commits et Version Bump

| Commits                        | Version Bump | Exemple                        |
| ------------------------------ | ------------ | ------------------------------ |
| `fix:` seulement               | PATCH        | 0.4.0 → 0.4.1                  |
| `feat:` présent                | MINOR        | 0.4.0 → 0.5.0                  |
| `feat!:` ou `BREAKING CHANGE:` | MAJOR        | 0.4.0 → 1.0.0                  |
| `docs:`, `chore:`, `ci:`       | Aucun        | PR mise à jour, pas de release |

## Forcer une Release

### Si PR de Release n'est pas créée

Parfois il faut un "commit vide" pour trigger:

```bash
git commit --allow-empty -m "chore: trigger release"
git push origin master
```

### Release Manuelle (Bypass release-please)

Si besoin urgent:

```bash
# 1. Script manuel
./scripts/release.sh patch

# 2. Push tag
git push origin master --tags

# 3. Docker build se déclenche automatiquement
```

## Configuration Avancée

### Customiser CHANGELOG

Modifier `release-please-config.json`:

```json
{
	"packages": {
		".": {
			"changelog-sections": [
				{ "type": "feat", "section": "✨ Features" },
				{ "type": "fix", "section": "🐛 Bug Fixes" },
				{ "type": "security", "section": "🔒 Security" }
			]
		}
	}
}
```

### Pull Request Title

Par défaut: `chore: release 0.5.0`

Pour changer: modifier le workflow.

### Bootstrap Initial

Si vous voulez partir de v0.4.0 actuel:

1. Créer tag manuel:

```bash
git tag -a v0.4.0 -m "Phase 2 - CI/CD Complete"
git push origin v0.4.0
```

2. release-please utilisera ce tag comme base

## Troubleshooting

### PR de release pas créée

**Causes possibles:**

- Aucun commit feat/fix depuis dernière release
- Seulement des commits docs/chore/ci
- Tag de release existe déjà

**Solution:**

```bash
# Commit vide pour forcer
git commit --allow-empty -m "chore: prepare release"
git push origin master
```

### Version bump incorrect

**Vérifier** vos types de commits:

- `feat` → MINOR
- `fix` → PATCH
- `feat!` ou `BREAKING CHANGE` → MAJOR

### CHANGELOG manque des commits

Vérifier que les commits suivent le format Conventional Commits.

### PR se ferme automatiquement

Normal si aucun nouveau commit depuis la dernière version.

## Monitoring

### Check Status

```bash
# Via GitHub UI
# → Actions → Release Please

# Via gh CLI
gh run list --workflow=release-please.yml

# Voir PR de release actuelle
gh pr list --label "autorelease: pending"
```

### Dernières Releases

```bash
gh release list

# Détails d'une release
gh release view v0.4.0
```

## Best Practices

### ✅ DO

- Utiliser Conventional Commits dès maintenant
- Laisser release-please gérer les versions
- Review les PRs de release avant merge
- Vérifier CHANGELOG avant release
- Utiliser scopes pour clarté

### ❌ DON'T

- Ne pas modifier manuellement package.json version
- Ne pas créer de tags manuels (sauf urgence)
- Ne pas skip la PR de release
- Ne pas merger plusieurs PRs de release

## Migration Depuis Script Manuel

Vous pouvez utiliser les deux en parallèle:

- **Normal flow**: release-please (automatique)
- **Hotfix/Urgence**: `scripts/release.sh` (manuel)

Ils sont compatibles tant que vous ne créez pas de tags conflictuels.

## Next Steps

1. ✅ Workflow installé
2. ✅ Config prête
3. ✅ Documentation complète
4. 🔜 Commencer à utiliser Conventional Commits
5. 🔜 Attendre premier PR de release-please

---

**Release-please est maintenant actif sur la branche master !**

Prochain commit avec `feat:` ou `fix:` créera automatiquement une PR de release.
