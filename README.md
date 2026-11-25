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

| Ruta                 | Pantalla                                                               |
| -------------------- | ---------------------------------------------------------------------- |
| `/`                  | Landing (hero, por qué, juegos, estadísticas, actividad, precios, CTA) |
| `/biblioteca`        | Biblioteca de juegos con búsqueda y filtro por categoría               |
| `/juegos/[id]`       | Detalle del juego                                                      |
| `/juegos/[id]/jugar` | Reproductor                                                            |
| `/salon`             | Salón de la Fama                                                       |
| `/login`             | Iniciar sesión / crear cuenta                                          |
| `/api/health`        | Estado de la conexión con Supabase                                     |

Los datos son simulados (sesión y puntuaciones en `localStorage`). Supabase está configurado pero aún no se usa para datos.

## Juegos

**METEORO** (`/juegos/meteoro/jugar`) es el primer juego real, marcado con el badge `JUGABLE`: una nave en un campo de meteoros que se parten al dispararles. Se juega con teclado; en dispositivos táctiles se muestra el aviso "REQUIERE TECLADO".

| Tecla     | Acción                               |
| --------- | ------------------------------------ |
| `←` `→`   | Rotar la nave                        |
| `↑`       | Propulsar                            |
| `Espacio` | Disparar (también inicia la partida) |

- Rocas grande / mediana / pequeña: 20 / 50 / 100 puntos.
- 3 vidas; cada nivel añade una roca grande más (`3 + nivel`).
- Núcleo `3x`: triple disparo durante 5 s.
- PAUSA, FIN y JUGAR DE NUEVO se controlan desde el HUD; la puntuación final se guarda en `av_scores`.

El resto del catálogo usa el reproductor simulado.

### Agregar un juego real

1. Motor TypeScript sin globals en `lib/<id>/engine.ts`, que emite su estado por callbacks y limpia el loop y los listeners en `destroy()`.
2. Client Component en `components/games/` que monta el canvas e implementa `PlayableGameProps`.
3. Registrarlo en `PLAYABLE` (`components/games/registry.ts`). El badge `JUGABLE` y la integración con `GamePlayer` salen del registro.

## Specs

- `specs/01-maqueta-visual.md` — maqueta visual (biblioteca, detalle, reproductor, salón, login)
- `specs/02-home-page.md` — landing en `/` y biblioteca movida a `/biblioteca`
- `specs/03-supabase-setup.md` — clientes de Supabase, variables de entorno y `/api/health`
- `specs/04-juego-meteoro.md` — METEORO, primer juego real (motor canvas, registro de juegos, badge `JUGABLE`)
