# SPEC 03 — Setup de Supabase

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-11-23
> **Objective:** Conectar la app al proyecto Supabase `fdgofioxluntopwullcf` con clientes browser y server de `@supabase/ssr`, variables de entorno, carpeta de migraciones, tipos generados y un endpoint `/api/health` que verifica la conexión, sin cambiar ninguna funcionalidad existente.

## Por qué existe esta spec

Hoy la app no tiene backend: sesión falsa en `av_user` y puntuaciones en `av_scores` (SPEC 01). Migrar auth y puntuaciones a la vez toca auth, base de datos y tres pantallas. Esta spec solo deja la infraestructura lista para que las specs de puntuaciones y de auth partan de una base probada.

`.mcp.json` ya apunta al proyecto `fdgofioxluntopwullcf`. `.env.local` existe pero está vacío.

## Alcance

**Dentro:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`, con valores obtenidos vía MCP (`get_project_url`, `get_publishable_keys`).
- `.env.example` versionado con los nombres de las variables y valores vacíos.
- Lectura validada de las variables en `lib/supabase/env.ts`.
- Cliente browser en `lib/supabase/client.ts` y cliente server (con cookies) en `lib/supabase/server.ts`, ambos tipados con `Database`.
- Carpeta `supabase/migrations/` versionada (con `.gitkeep`).
- `types/database.ts` generado vía MCP (`generate_typescript_types`), sin tablas propias aún.
- Route handler `GET /api/health` que informa si Supabase responde.
- Actualizar `CLAUDE.md` con la nueva estructura (`lib/supabase/`, `supabase/migrations/`, `types/`, `/api/health`).

**Fuera de alcance (specs futuras):**

- Tablas de negocio (puntuaciones, perfiles) y sus migraciones.
- Guardar o leer puntuaciones en Supabase: `GamePlayer`, detalle y salón siguen con `av_scores` y `seededScores`.
- Auth real con Supabase Auth: la sesión falsa `av_user` se mantiene.
- `proxy.ts` (antes `middleware`) para refrescar sesión: va con la spec de auth.
- Mover el catálogo `GAMES` a Supabase: queda en `lib/games.ts`.
- Supabase CLI y stack local con Docker.
- Edge Functions, Storage, Realtime.
- Tests automatizados.

## Modelo de datos

Esta spec no introduce tablas. Estructuras nuevas:

```ts
// .env.local / .env.example
NEXT_PUBLIC_SUPABASE_URL=https://fdgofioxluntopwullcf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

// lib/supabase/env.ts
export declare function getSupabaseEnv(): { url: string; key: string }; // lanza Error si falta alguna

// lib/supabase/client.ts  (solo navegador)
export declare function createClient(): SupabaseClient<Database>;

// lib/supabase/server.ts  (Server Components y route handlers)
export declare function createClient(): Promise<SupabaseClient<Database>>; // usa await cookies()

// types/database.ts
export type Database = { public: { Tables: {}; Views: {}; Functions: {}; /* ... */ } };

// GET /api/health
type HealthResponse =
  | { supabase: "ok" }
  | { supabase: "error"; reason: "missing_env" | "unreachable" };
```

Convenciones:

- Solo se usa la publishable key. Ninguna `service_role` / secret key entra al repo ni a `.env.local`.
- Migraciones futuras: `supabase/migrations/<YYYYMMDDHHMMSS>_<slug>.sql`, aplicadas al remoto con MCP `apply_migration`.
- `types/database.ts` se regenera vía MCP tras cada migración; no se edita a mano.
- `/api/health` responde `200` con `ok` y `503` con `error`. Nunca devuelve la URL ni la key.

## Plan de implementación

Antes del paso 1: leer en `node_modules/next/dist/docs/01-app` las guías de route handlers, `cookies()` asíncrono y variables de entorno (según `AGENTS.md`).

1. Instalar `@supabase/supabase-js` y `@supabase/ssr`. Verificación: `npm run build` sin errores.
2. Variables de entorno: rellenar `.env.local` con URL y publishable key vía MCP; crear `.env.example`; agregar `!.env.example` en `.gitignore` (hoy ignora `.env*`). Crear `lib/supabase/env.ts`. Verificación: `git status` muestra `.env.example` y no `.env.local`.
3. Crear `supabase/migrations/.gitkeep` y generar `types/database.ts` con MCP `generate_typescript_types`. Verificación: `npx tsc --noEmit` sin errores.
4. Crear `lib/supabase/client.ts` (`createBrowserClient<Database>`) y `lib/supabase/server.ts` (`createServerClient<Database>` con `getAll`/`setAll` sobre `await cookies()`, `setAll` en `try/catch` para Server Components). Verificación: `npx tsc --noEmit` sin errores.
5. Crear `app/api/health/route.ts`: valida env con `getSupabaseEnv()`, crea el cliente server y hace un `fetch` a `${url}/auth/v1/health` con header `apikey`. Respuesta dinámica (sin caché). Verificación: `curl localhost:3000/api/health` devuelve `{"supabase":"ok"}`.
6. Actualizar `CLAUDE.md` (estructura y gotchas de Supabase). Verificación: `npm run build` y `npm run lint` sin errores.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan con código 0.
- [x] `package.json` lista `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [x] `.env.example` está versionado con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vacías; `.env.local` sigue ignorado por git.
- [x] Ningún archivo versionado contiene una key de Supabase ni la palabra `service_role`.
- [x] Existen `supabase/migrations/.gitkeep`, `types/database.ts`, `lib/supabase/env.ts`, `lib/supabase/client.ts` y `lib/supabase/server.ts`.
- [x] `GET /api/health` con `.env.local` correcto responde `200` y `{"supabase":"ok"}`.
- [x] `GET /api/health` sin las variables de entorno responde `503` y `{"supabase":"error","reason":"missing_env"}`.
- [x] `GET /api/health` con una URL inalcanzable responde `503` y `{"supabase":"error","reason":"unreachable"}`.
- [x] La respuesta de `/api/health` no incluye la URL ni la key.
- [x] `/`, `/biblioteca`, `/juegos/caida`, `/juegos/caida/jugar`, `/login` y `/salon` siguen funcionando igual que en SPEC 02 (login con `av_user`, guardado en `av_scores`).
- [x] `CLAUDE.md` menciona `lib/supabase/`, `supabase/migrations/`, `types/database.ts` y `/api/health`.

## Decisiones tomadas y descartadas

- **Sí:** solo setup en esta spec. Auth, puntuaciones y esquema son tres dominios; juntos rompen la regla de spec pequeña.
- **No:** auth + puntuaciones ahora. Cada uno va en su spec sobre esta base.
- **Sí:** `@supabase/ssr` con clientes browser y server. Es el patrón oficial para Next App Router y sirve tal cual para la futura auth con cookies.
- **No:** un solo cliente `supabase-js` plano. Habría que rehacerlo al llegar auth.
- **Sí:** migraciones SQL en `supabase/migrations/` aplicadas con MCP. Quedan versionadas en el repo sin requerir Docker.
- **No:** SQL aplicado solo vía MCP sin archivos. El esquema no quedaría en el historial.
- **No:** Supabase CLI con stack local. Docker y setup extra sin beneficio para un prototipo.
- **Sí:** `types/database.ts` generado ya, aunque vacío. Los clientes nacen tipados y las specs siguientes solo regeneran.
- **Sí:** catálogo `GAMES` en `lib/games.ts`. Es estático; futuras tablas lo referencian por slug.
- **Sí:** proyecto `fdgofioxluntopwullcf` (el de `.mcp.json`).
- **Sí:** verificación con `/api/health`. Probable con `curl`, sin UI nueva.
- **No:** script npm de chequeo o solo `build`. El script no prueba el runtime de Next; `build` no prueba la red.
- **Sí:** el health hace `fetch` a `/auth/v1/health`. Sin tablas no hay consulta PostgREST significativa; ese endpoint responde siempre que el proyecto esté activo.
- **No:** `proxy.ts` de refresco de sesión. Sin auth real no hay sesión que refrescar.
- **Sí:** publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) en lugar de la anon key legacy. Es la recomendada por Supabase para clientes.

## Riesgos

| Riesgo                                                               | Mitigación                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Key filtrada al repo                                                 | `.env*` sigue ignorado salvo `.env.example` vacío; criterio de aceptación revisa archivos versionados.        |
| `.gitignore` con `.env*` ignora también `.env.example`               | Agregar `!.env.example` en el paso 2 y comprobar con `git status`.                                            |
| `cookies()` asíncrono o caché de route handlers distintos en Next 16 | Leer las guías de `node_modules/next/dist/docs` antes del paso 4; forzar respuesta dinámica en `/api/health`. |
| Proyecto Supabase pausado (plan free)                                | `/api/health` devuelve `unreachable`; reactivar desde el dashboard.                                           |
| Importar `lib/supabase/server.ts` desde un Client Component          | Solo se usa en Server Components y route handlers; `client.ts` es el único para el navegador.                 |

## Qué **no** está en esta spec

- Tablas de puntuaciones, perfiles o cualquier esquema de negocio.
- Lectura o escritura de puntuaciones en Supabase.
- Auth real (Supabase Auth, OAuth) y `proxy.ts`.
- Catálogo de juegos en base de datos.
- Supabase CLI, Edge Functions, Storage, Realtime.
- Tests automatizados.

Cada uno de esos puntos, si se aborda, va en su propia spec.
