# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online game platform where players compete for points. Early stage — still the Create Next App scaffold (`app/page.tsx`, default metadata). README says the project follows spec-driven design (`/spec`, `/spec-impl`) using skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`).

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner configured.

## Stack and gotchas

- Next.js 16.4.4, React 19.3, Tailwind CSS v4 (via `@tailwindcss/turbopack` loader in `next.config.ts`; config lives in CSS, `app/globals.css` uses `@import "tailwindcss"` and `@theme inline`), TypeScript strict-style config.
- **Next.js has breaking changes vs. training data.** Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next code, and heed deprecation notices.
- App Router only (`app/`). Root layout uses the global `LayoutProps<"/">` type (no import needed) and `next/font` Geist fonts exposed as CSS vars.
- Path alias: `@/*` maps to the project root (not `src/`).
- `AGENTS.md` is auto re-written by `next dev`; commit it rather than removing it.
