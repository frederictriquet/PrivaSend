# Phase 3.1 - Authentification & Accès - Plan d'Implémentation

**Status**: EN COURS - Schema DB mis à jour
**Date**: 2025-11-29

## Travail Déjà Effectué

### ✅ Complété

1. **Dependencies ajoutées**
   - `bcrypt` v5.1.1 (password hashing)
   - `@types/bcrypt` (TypeScript types)

2. **Schema Database mis à jour**
   - Ajout champ `passwordHash TEXT` (bcrypt hash ou NULL)
   - Ajout champ `pin TEXT` (PIN hashé ou NULL)
   - Ajout champ `allowedIps TEXT` (IPs séparées par virgule ou NULL)

## Travail Restant

### 3.1.1 Protection par Mot de Passe

**Backend** :
- Créer `src/lib/server/auth.ts` avec fonctions bcrypt
- Mettre à jour `createShareLink()` pour accepter password optionnel
- Créer API `POST /api/verify-password` pour vérification

**Frontend** :
- Ajouter champ password dans upload page (section "Advanced Options")
- Créer page/modal de vérification password avant download
- Mettre à jour download flow

**Fichiers à créer/modifier** :
- `src/lib/server/auth.ts` - NEW
- `src/routes/api/verify-password/+server.ts` - NEW
- `src/routes/download/[token]/+page.svelte` - MODIFY (add password input)
- `src/routes/+page.svelte` - MODIFY (add password field)
- `src/lib/server/database.ts` - MODIFY (createShareLink signature)

### 3.1.2 Download Limits (UI)

**Note**: Logique backend déjà en place (maxDownloads field exists)

**Frontend seulement** :
- Ajouter dropdown/radio dans upload page (1x, 5x, 10x, unlimited)
- Afficher downloads restants sur download page
- Message d'erreur si limite atteinte

**Fichiers à modifier** :
- `src/routes/+page.svelte` - Add maxDownloads selector
- `src/routes/download/[token]/+page.svelte` - Display remaining

### 3.1.3 PIN Code

**Backend** :
- Générer PIN 6 chiffres
- Hasher avec bcrypt
- Vérification similaire au password

**Frontend** :
- Toggle PIN dans upload
- Input PIN avant download

**Fichiers** :
- Utiliser même système que password

### 3.1.4 IP Whitelist

**Backend** :
- Parser allowedIps (comma-separated)
- Vérifier IP client
- Bloquer si non dans la liste

**Frontend** :
- Input textarea pour IPs
- Affichage des restrictions

## Code Templates

### auth.ts

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### Updated createShareLink

```typescript
createShareLink(
  token: string,
  fileId: string,
  expiresAt: Date,
  options?: {
    maxDownloads?: number | null;
    passwordHash?: string | null;
    pin?: string | null;
    allowedIps?: string | null;
  }
): ShareLink {
  // INSERT avec nouveaux champs
}
```

### Upload Page - Advanced Options UI

```svelte
<details class="advanced-options">
  <summary>Advanced Options</summary>

  <label>
    <input type="checkbox" bind:checked={usePassword} />
    Protect with password
  </label>

  {#if usePassword}
    <input type="password" bind:value={password} placeholder="Enter password" />
  {/if}

  <label>Download limit:</label>
  <select bind:value={maxDownloads}>
    <option value={null}>Unlimited</option>
    <option value={1}>1 download</option>
    <option value={5}>5 downloads</option>
    <option value={10}>10 downloads</option>
  </select>
</details>
```

### Password Verification Modal

```svelte
{#if requiresPassword && !passwordVerified}
  <div class="password-modal">
    <h3>Password Required</h3>
    <input
      type="password"
      bind:value={enteredPassword}
      placeholder="Enter password"
    />
    <button onclick={verifyPasswordAndDownload}>
      Unlock
    </button>
  </div>
{/if}
```

## Tests à Ajouter

```typescript
// tests/unit/lib/auth.test.ts
describe('auth', () => {
  it('should hash password', async () => {
    const hash = await hashPassword('test123');
    expect(hash).not.toBe('test123');
  });

  it('should verify correct password', async () => {
    const hash = await hashPassword('test123');
    const valid = await verifyPassword('test123', hash);
    expect(valid).toBe(true);
  });
});
```

## Migration Database

Si la DB existe déjà, ajouter migration :

```sql
ALTER TABLE share_links ADD COLUMN passwordHash TEXT;
ALTER TABLE share_links ADD COLUMN pin TEXT;
ALTER TABLE share_links ADD COLUMN allowedIps TEXT;
```

Ou supprimer `storage/privasend.db` et relancer (development).

## Estimation

- Password Protection : 2-3 heures
- Download Limits UI : 1 heure
- PIN Code : 1-2 heures
- IP Whitelist : 1 heure

**Total** : 5-7 heures de développement

## Prochaines Étapes Recommandées

1. Installer bcrypt : `npm install`
2. Créer `src/lib/server/auth.ts`
3. Mettre à jour `createShareLink()` signature
4. Ajouter UI dans upload page
5. Implémenter vérification dans download
6. Tester end-to-end
7. Ajouter tests unitaires

---

**Note**: Schema DB déjà prêt, il reste principalement du travail frontend et logique de vérification.
