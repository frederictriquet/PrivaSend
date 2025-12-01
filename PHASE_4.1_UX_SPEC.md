# Phase 4.1 - Interface Web Moderne

**Status** : 🔜 En cours
**Priorité** : Moyenne
**Estimation** : 1-2 jours

## Objectif

Améliorer l'expérience utilisateur avec un mode sombre/clair et un design responsive optimisé.

## Fonctionnalités

### 1. Mode Sombre/Clair ✅ (Déjà Présent)

- Design actuel : Dégradé violet/bleu
- Glisser-déposer : ✅
- Barre de progression : ✅

### 2. À Implémenter

#### Dark Mode Toggle

- Bouton toggle (🌙/☀️)
- Persistance dans localStorage
- Thème appliqué globalement
- Variables CSS pour les couleurs

#### Responsive Mobile

- Breakpoints optimisés
- Touch-friendly buttons
- Simplified layout sur petit écran
- Optimisation des espacements

## Implementation

### Theme Store

**`src/lib/stores/theme.ts`** :

```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const stored = browser ? localStorage.getItem('theme') : null;
	const initial: Theme = (stored as Theme) || 'light';

	const { subscribe, set } = writable<Theme>(initial);

	return {
		subscribe,
		toggle() {
			set(get(this) === 'light' ? 'dark' : 'light');
		},
		set(theme: Theme) {
			if (browser) {
				localStorage.setItem('theme', theme);
				document.documentElement.setAttribute('data-theme', theme);
			}
			set(theme);
		}
	};
}

export const theme = createThemeStore();
```

### CSS Variables

**`src/app.css`** (nouveau) :

```css
:root[data-theme='light'] {
	--bg-gradient-start: #667eea;
	--bg-gradient-end: #764ba2;
	--bg-primary: #ffffff;
	--text-primary: #333333;
	--text-secondary: #666666;
	--border-color: #e0e0e0;
	--accent: #667eea;
}

:root[data-theme='dark'] {
	--bg-gradient-start: #1a1a2e;
	--bg-gradient-end: #16213e;
	--bg-primary: #0f3460;
	--text-primary: #e4e4e7;
	--text-secondary: #a1a1aa;
	--border-color: #27272a;
	--accent: #818cf8;
}
```

### Theme Toggle Button

**Dans `+layout.svelte`** :

```svelte
<button class="theme-toggle" onclick={toggleTheme}>
	{$theme === 'light' ? '🌙' : '☀️'}
</button>
```

## Estimation

- Dark mode : 3h
- CSS variables : 2h
- Responsive improvements : 2h
- Testing : 1h

**Total** : ~8h (1 jour)
