# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online game platform where players compete for points. Prototype with simulated data (no backend in use yet); METEORO is the only real playable game, the rest of the catalog uses the simulated player. Follows spec-driven design (`/spec`, `/spec-impl`); specs live in `specs/` (SPEC 01 visual mockup, SPEC 02 home page, SPEC 03 Supabase setup, SPEC 04 METEORO, first real game), skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`).

## Routes and structure

- `/` landing (`app/page.tsx`, Server Component) · `/biblioteca` game library · `/juegos/[id]` detail · `/juegos/[id]/jugar` player · `/salon` hall of fame · `/login` auth.
- `components/` shared UI (`Nav`, `Footer`, `Library`, `GameCard`, `GamePlayer`, `HallOfFame`, `AuthForm`); `components/home/` landing pieces (`FloatingSilhouettes`, `FeatureIcon`, `MiniCard` are Server Components; `Reveal` is the only Client Component, adds class `in` via `IntersectionObserver`).
- `lib/`: `games.ts` (game catalog), `home.ts` (fixed landing data), `scores.ts` (scores in `localStorage`), `session.tsx` (simulated session).
- Real games (SPEC 04): `lib/meteoro/engine.ts` is a framework-free TS canvas engine (`createMeteoroEngine(canvas, { onStats, onGameOver })` → `start/pause/resume/end/destroy`; no globals, keyboard listeners added on `start()` and removed in `destroy()`, ignores keys while focus is in `input`/`textarea`, draws no HUD/overlays). `components/games/MeteoroGame.tsx` (Client Component) mounts the 800×600 canvas (`.game-canvas`, CSS-scaled to the 4:3 `.crt-screen`), creates the engine in `useEffect`, calls `destroy()` in cleanup and exposes `start`/`end` via `ref`. `components/games/registry.ts`: `PLAYABLE` (`id → component`), `isPlayable(id)`, `PlayableGameProps`/`PlayableGameHandle`.
- `GamePlayer`: ids in `PLAYABLE` get the real game (React HUD fed by `onStats`, "PULSA ESPACIO" start screen, "REQUIERE TECLADO" on `(pointer: coarse)`, PAUSA/FIN/JUGAR DE NUEVO drive the engine, final score saved to `av_scores`); other ids keep the simulated `setInterval` player. `GameCard` and `/juegos/[id]` show the `JUGABLE` badge for registry ids.
- Adding a real game: engine in `lib/<id>/engine.ts` with the same callback/handle shape → Client Component in `components/games/` implementing `PlayableGameProps` → register it in `PLAYABLE`. No `playable` field in `Game`; the registry is the single source of truth.
- `lib/supabase/`: `env.ts` (`getSupabaseEnv()`, lanza si faltan variables), `client.ts` (browser, solo Client Components), `server.ts` (async, `await cookies()`; solo Server Components y route handlers). Ambos tipados con `Database`.
- `types/database.ts`: generado vía MCP `generate_typescript_types`; no se edita a mano, se regenera tras cada migración.
- `supabase/migrations/<YYYYMMDDHHMMSS>_<slug>.sql`: migraciones versionadas, aplicadas al remoto con MCP `apply_migration` (sin CLI ni Docker).
- `GET /api/health` (`app/api/health/route.ts`): `200 {"supabase":"ok"}` o `503 {"supabase":"error","reason":"missing_env"|"unreachable"}`. Nunca devuelve URL ni key.
- Styles are plain CSS ported from `references/templates/` into `app/globals.css` (not Tailwind utilities). `references/**` is the prototype reference, excluded from ESLint.
- Login redirects to `/`; "volver" links go to `/biblioteca`. Landing numbers use `toLocaleString("es-ES")` (Server Component only, no hydration warning).

## Stack and gotchas

- Next.js 16.4.4, React 19.3, Tailwind CSS v4 (via `@tailwindcss/turbopack` loader in `next.config.ts`; config lives in CSS, `app/globals.css` uses `@import "tailwindcss"` and `@theme inline`), TypeScript strict-style config.
- **Next.js has breaking changes vs. training data.** Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next code, and heed deprecation notices.
- App Router only (`app/`). Root layout uses the global `LayoutProps<"/">` type (no import needed) and `next/font` Press Start 2P, JetBrains Mono and Courier Prime exposed as CSS vars.
- Path alias: `@/*` maps to the project root (not `src/`).
- Supabase (SPEC 03): proyecto `fdgofioxluntopwullcf`, solo setup. Env en `.env.local` (ignorado; plantilla en `.env.example`): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Solo publishable key; nunca keys secretas en el repo. La app sigue con sesión falsa `av_user` y `av_scores`; auth y puntuaciones reales van en specs futuras.
- Con `cacheComponents: true` no usar `export const dynamic` en route handlers; `/api/health` es dinámico por `cookies()` y `fetch` con `cache: "no-store"`.
- `AGENTS.md` is auto re-written by `next dev`; commit it rather than removing it.
- Next keeps a left route's client state alive (`<Activity>`): effects are cleaned up on leave and re-run on return, but `useState` survives. Components that own imperative resources (canvas engines) must reset their React state in the effect cleanup (see `GamePlayer`).
- The format hook (Prettier) rewrites the whole file on every edit; expect large formatting-only diffs on files that were not formatted before.
- `npm run build` may stop once with `SecurityFatalError` (Next.js upgrade nudge); retrying the same command continues the build.
- `next dev` sometimes serves a stale `globals.css` after an edit; if a new class has no styles, make another real content change to the file (touching mtime is not enough) or restart the dev server.

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario
