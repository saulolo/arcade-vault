# SPEC 02 — Home page de Arcade Vault

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-11-08
> **Objective:** Portar a Next.js la landing de `references/templates/home-about/home-about/home.jsx` como página `/`, mover la biblioteca a `/biblioteca` y agregar "Inicio" a la navbar, solo en su parte visual y con datos simulados.

## Por qué existe esta spec

SPEC 01 dejó la biblioteca en `/`. El nuevo template (`references/templates/home-about`) define un flujo distinto: una landing de presentación (Inicio) y la biblioteca como pantalla separada. Mover la biblioteca cambia rutas existentes, por eso queda registrado aquí.

`app/globals.css` **no** contiene ninguna clase de la landing (`home-*`, `feature-*`, `mini-*`, `stat-*`, `activity-*`, `ticker`, `top-*`, `pricing-*`, `price-*`, `faq-*`, `reveal`, `section-*`). Hay que portarlas desde `styles.css` del template.

## Alcance

**Dentro:**

- Nueva ruta `/` con la landing: hero con siluetas flotantes, "¿Por qué Arcade Vault?", "Juegos disponibles ahora", bloque de estadísticas, "Actividad en vivo", "Precios" (con FAQ) y CTA final.
- Mover la biblioteca de `/` a `/biblioteca` (misma pantalla de SPEC 01, sin cambios funcionales).
- Navbar (desktop y panel móvil): nuevo enlace "Inicio" a `/`; "Biblioteca" apunta a `/biblioteca`; el logo apunta a `/`.
- Actualizar los enlaces "volver a la biblioteca" para que apunten a `/biblioteca`.
- Animación de revelado al hacer scroll (clase `reveal` + `IntersectionObserver`) en Client Component.
- Datos simulados de la landing en `lib/home.ts`; el rail usa `GAMES.slice(0, 6)`.
- Portar a `app/globals.css` las reglas del template: sección `/* ===== HOME PAGE ===== */` (líneas 930–1070 de `styles.css`) y `ACTIVITY` y `PRICING` (líneas 1621–1730), más las `@media` asociadas y las `@keyframes` que usen y no existan.

**Fuera de alcance (specs futuras):**

- Página "Acerca de" y formulario de contacto (`about.jsx`): su propia spec.
- Alimentar actividad, top de jugadores o estadísticas con `av_scores` o `seededScores`: los datos de la landing son fijos.
- Backend, estadísticas reales, ranking real.
- Cambiar créditos (`CRÉDITOS · 03` sigue siendo texto fijo).
- Tests automatizados.
- Internacionalización.

## Modelo de datos

Estructuras nuevas, tipadas a partir de `home.jsx`:

```ts
// lib/home.ts
export type NeonColor = "cyan" | "magenta" | "green" | "yellow";

export type Feature = {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: NeonColor;
};
export type HomeStat = { n: string; u: string; s: string };
export type RecentScore = { player: string; game: string; score: number; when: string; color: NeonColor };
export type TopPlayer = { rank: number; player: string; score: number };
export type FaqItem = { q: string; a: string };

export declare const FEATURES: Feature[];          // 4 tarjetas
export declare const HOME_STATS: HomeStat[];       // 3 bloques
export declare const RECENT_SCORES: RecentScore[]; // 7 filas
export declare const TOP_PLAYERS: TopPlayer[];     // 5 filas
export declare const PRICING_PERKS: string[];      // 6 ítems
export declare const FAQ: FaqItem[];               // 3 preguntas
```

Convenciones:

- Los valores se copian tal cual de `home.jsx` (textos en español, nombres de jugador, puntajes, tiempos).
- Formato numérico `toLocaleString("es-ES")`, igual que SPEC 01. Si aparece warning de hidratación, usar `Intl.NumberFormat("es-ES")` creado una vez en `lib/`.
- No se agrega estado de sesión ni `localStorage`.

## Plan de implementación

Antes del paso 1: leer en `node_modules/next/dist/docs/01-app` las guías de Server y Client Components y de `Link`/`usePathname` (según `AGENTS.md`).

1. Portar el CSS: copiar a `app/globals.css` las reglas `HOME PAGE`, `ACTIVITY` y `PRICING` de `styles.css` con sus `@media`; agregar `@keyframes` faltantes. Verificación: `npm run build` sin errores.
2. Crear `lib/home.ts` con los datos de la landing. Verificación: `npx tsc --noEmit` sin errores.
3. Mover la biblioteca: crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx` (`<Library />`). Dejar `/` temporalmente igual. Verificación: `/biblioteca` muestra la biblioteca.
4. Actualizar `components/Nav.tsx`: enlace "Inicio" (`/`, activo solo con `pathname === "/"`), "Biblioteca" a `/biblioteca` (activo en `/biblioteca`, `/juegos/*`), logo a `/`, en desktop y panel móvil.
5. Actualizar enlaces de retorno: `app/juegos/[id]/page.tsx`, `components/GamePlayer.tsx` y `components/HallOfFame.tsx` pasan de `href="/"` a `href="/biblioteca"`.
6. Crear `components/home/FloatingSilhouettes.tsx` y `components/home/FeatureIcon.tsx` (SVG puros, Server Components) portados de `home.jsx`.
7. Crear `components/home/MiniCard.tsx` (con `Link` a `/juegos/[id]`) y `components/home/Reveal.tsx` (Client Component: `IntersectionObserver` que añade la clase `in`, con limpieza en el `return` del efecto).
8. Reemplazar `app/page.tsx` por la landing: hero, ¿Por qué?, juegos disponibles, estadísticas, actividad en vivo, precios y CTA final. Los botones del template pasan a `Link` con clase `btn` (EXPLORAR JUEGOS → `/biblioteca`, CREAR CUENTA y EMPEZAR GRATIS → `/login`, VER TODOS → `/biblioteca`, VER SALÓN → `/salon`, INSERTAR MONEDA → `/biblioteca`).
9. Agregar `metadata` de la ruta `/` (título y descripción) si el layout aún usa los valores por defecto. Verificación: `npm run build` y `npm run lint` sin errores.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan con código 0.
- [x] `/` y `/biblioteca` cargan sin errores ni warnings de hidratación en la consola.
- [x] `/` muestra, en orden: hero (3 líneas de título), 4 tarjetas "¿Por qué?", 6 mini-tarjetas, 3 bloques de estadísticas, 7 filas de puntuaciones recientes, 5 filas de top jugadores, tarjeta de precios con 6 ítems y 3 preguntas de FAQ, y CTA final.
- [x] Las 8 siluetas del hero se renderizan y flotan; en `prefers-reduced-motion` no es obligatorio animarlas.
- [x] Las secciones con clase `reveal` aparecen (clase `in`) al entrar en el viewport.
- [x] EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA llevan a `/biblioteca`.
- [x] CREAR CUENTA y EMPEZAR GRATIS llevan a `/login`; VER SALÓN lleva a `/salon`.
- [x] Clic en una mini-tarjeta lleva a `/juegos/[id]` de ese juego.
- [x] `/biblioteca` conserva búsqueda, filtro por categoría y estado "NO HAY RESULTADOS" de SPEC 01.
- [x] La navbar muestra "Inicio" activo solo en `/`; "Biblioteca" activo en `/biblioteca`, `/juegos/*` y `/juegos/*/jugar`; "Salón de la Fama" en `/salon`.
- [x] El logo lleva a `/` y "Inicio" aparece también en el panel móvil (ancho ≤ 480 px).
- [x] "VOLVER AL VAULT" (detalle y reproductor) y "VOLVER A LA BIBLIOTECA" (salón) llevan a `/biblioteca`.
- [x] La landing no desborda horizontalmente a 375 px de ancho; el rail pasa a 3 columnas (≤ 1100 px) y a 2 (≤ 600 px).
- [x] El flujo de login de SPEC 01 sigue redirigiendo tras iniciar sesión (destino `/`).

## Decisiones tomadas y descartadas

- **Sí:** solo Home en esta spec. `about.jsx` es otra pantalla con formulario y estado propio; mezclarlas agranda la spec sin necesidad.
- **No:** incluir "Acerca de" y contacto ahora. Va en spec 03.
- **Sí:** mover la biblioteca a `/biblioteca`. Coincide con el template (Inicio y Biblioteca separados) y deja la raíz para la landing.
- **No:** landing en `/inicio` con la biblioteca en `/`. Se aparta del template y la raíz seguiría mostrando la biblioteca.
- **Sí:** portar CSS desde `styles.css` a `globals.css`. Máxima fidelidad, mismo criterio que SPEC 01.
- **No:** reescribir con utilidades Tailwind. Riesgo de divergir del diseño.
- **Sí:** datos fijos en `lib/home.ts`. Contrato claro para una futura API.
- **No:** leer `av_scores` en la landing. SPEC 01 lo dejó fuera y ampliaría el alcance.
- **Sí:** `Link` de Next en lugar de `navigate()` del template. Da navegación real por URL y prefetch.
- **Sí:** `app/page.tsx` como Server Component; solo `Reveal` es Client Component. Reduce JS enviado al navegador.
- **Sí:** el redirect tras login se mantiene en `/`. Ahora es la landing; cambiarlo no pertenece a esta spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Contenido `reveal` queda invisible (opacity 0) si falla el observer o JS está desactivado | `Reveal` añade `in` en el montaje si no existe `IntersectionObserver`; verificar en consola y sin JS. |
| Rutas viejas (`/` como biblioteca) quedan referenciadas | Buscar `href="/"` y `router.push("/")` en `app/` y `components/` (paso 5) antes de cerrar. |
| `toLocaleString("es-ES")` distinto entre servidor y navegador | Verificar consola; si hay warning, usar `Intl.NumberFormat` instanciado en `lib/`. |
| Reglas CSS duplicadas o en conflicto con `globals.css` (p. ej. `.hero-eyebrow`, `.lb-link`) | Comparar selectores antes de pegar; no duplicar los que ya existen. |
| API de Next 16 distinta a lo conocido | Leer las guías de `node_modules/next/dist/docs` antes de escribir las rutas. |

## Qué **no** está en esta spec

- Página "Acerca de" y formulario de contacto.
- Datos de la landing alimentados por `av_scores` o por un backend.
- Estadísticas, ranking o actividad reales.
- Créditos dinámicos.
- Tests automatizados.
- Idiomas distintos del español.

Cada uno de esos puntos, si se aborda, va en su propia spec.
