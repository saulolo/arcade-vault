## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner configured.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Landing (hero, por qué, juegos, estadísticas, actividad, precios, CTA) |
| `/biblioteca` | Biblioteca de juegos con búsqueda y filtro por categoría |
| `/juegos/[id]` | Detalle del juego |
| `/juegos/[id]/jugar` | Reproductor |
| `/salon` | Salón de la Fama |
| `/login` | Iniciar sesión / crear cuenta |

Todo es visual y con datos simulados (sin backend).

## Specs

- `specs/01-maqueta-visual.md` — maqueta visual (biblioteca, detalle, reproductor, salón, login)
- `specs/02-home-page.md` — landing en `/` y biblioteca movida a `/biblioteca`
