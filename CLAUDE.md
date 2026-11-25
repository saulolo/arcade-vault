# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online game platform where players compete for points. Visual-only prototype with simulated data (no backend). Follows spec-driven design (`/spec`, `/spec-impl`); specs live in `specs/` (SPEC 01 visual mockup, SPEC 02 home page), skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`).

## Routes and structure

- `/` landing (`app/page.tsx`, Server Component) · `/biblioteca` game library · `/juegos/[id]` detail · `/juegos/[id]/jugar` player · `/salon` hall of fame · `/login` auth.
- `components/` shared UI (`Nav`, `Footer`, `Library`, `GameCard`, `GamePlayer`, `HallOfFame`, `AuthForm`); `components/home/` landing pieces (`FloatingSilhouettes`, `FeatureIcon`, `MiniCard` are Server Components; `Reveal` is the only Client Component, adds class `in` via `IntersectionObserver`).
- `lib/`: `games.ts` (game catalog), `home.ts` (fixed landing data), `scores.ts` (scores in `localStorage`), `session.tsx` (simulated session).
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

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario
