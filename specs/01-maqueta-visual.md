# SPEC 01 — Maqueta visual de Arcade Vault

> **Status:** Implementado
> **Depends on:** ninguna
> **Date:** 2026-11-02
> **Objective:** Portar a Next.js (App Router, TypeScript) las 5 pantallas de `references/templates` (biblioteca, detalle, reproductor, auth y salón de la fama) con navbar y footer, solo en su parte visual y con datos simulados.

## Por qué existe esta spec

`references/templates` es un prototipo SPA en React UMD + Babel (estado de ruta en el hash, `window.X` globales). El proyecto real es Next.js 16 con App Router. Esta spec convierte el prototipo en la base visual sobre la que se construirán después los juegos y el backend.

`app/globals.css` ya contiene todas las clases del `styles.css` del template (mismo conjunto de selectores, incluidas las portadas `cover-*`) y `app/layout.tsx` ya carga las fuentes con `next/font`. Esta spec **no** rehace los estilos, solo los verifica.

## Alcance

**Dentro:**

- Rutas App Router: `/` (biblioteca), `/juegos/[id]` (detalle), `/juegos/[id]/jugar` (reproductor), `/login` (auth), `/salon` (salón de la fama).
- Navbar (con menú móvil lateral) y footer compartidos desde `app/layout.tsx`.
- Datos simulados en TypeScript: `GAMES`, `CATS` y `seededScores` portados desde `data.jsx`.
- Sesión falsa: `{ name }` guardada en `localStorage` bajo la clave `av_user`, accesible por Context.
- Reproductor simulado: HUD, marco CRT con arena decorativa, puntaje que sube solo, pausa, botón FIN, modal de fin de juego y guardado de la puntuación en `localStorage` (`av_scores`).
- Búsqueda por nombre y filtro por categoría en la biblioteca.
- Estado "no hay resultados" en la biblioteca y `notFound()` para ids de juego inexistentes.

**Fuera de alcance (specs futuras):**

- Implementar cualquier juego real (motor, canvas, controles, colisiones).
- Backend, base de datos, autenticación real, OAuth (los botones Google/GitHub son decorativos).
- Leer `av_scores` en el salón de la fama o en el detalle: esas pantallas siguen con `seededScores`.
- Créditos reales: el contador `CRÉDITOS · 03` es texto fijo.
- Tests automatizados.
- Internacionalización: la interfaz queda solo en español.

## Modelo de datos

Estructuras nuevas, tipadas a partir de `data.jsx`, `app.jsx` y `reproductor.jsx`:

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type Game = {
  id: string;            // slug: "bloque-buster", "caida", ...
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;         // clase CSS: "cover-bricks", ...
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;         // "12.4K"
};
export declare const GAMES: Game[];               // los 8 juegos del template
export declare const CATS: readonly ["TODOS", ...GameCategory[]];

// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string };
export declare function seededScores(seed: number, count?: number): ScoreRow[];

// lib/session.tsx
export type User = { name: string };              // máx. 10 caracteres, mayúsculas
// localStorage "av_user"   -> JSON de User | ausente
// localStorage "av_scores" -> JSON de { game: string; score: number; name: string; at: number }[]
```

Convenciones:

- `seededScores` es determinista: mismos argumentos, mismas filas (necesario para que servidor y cliente rendericen igual).
- Formato numérico `toLocaleString("es-ES")`, igual que el template.
- Toda lectura de `localStorage` ocurre en `useEffect` o después del montaje, envuelta en `try/catch`.

## Plan de implementación

Antes del paso 1: leer en `node_modules/next/dist/docs/01-app` las guías de rutas dinámicas, `params` asíncrono, `notFound` y Client Components (según `AGENTS.md`).

1. Crear `lib/games.ts` y `lib/scores.ts` portando `data.jsx` a TypeScript. Verificación: `npx tsc --noEmit` sin errores.
2. Crear `lib/session.tsx` con `SessionProvider` y el hook `useSession()` (`user`, `login(user | null)`, `signOut()`), hidratando `av_user` tras el montaje.
3. Crear `components/Nav.tsx` (Client Component con `usePathname`, menú móvil, botón de sesión) y `components/Footer.tsx`. Actualizar `app/layout.tsx` para envolver `children` con `SessionProvider`, `Nav` y `<main className="av-main">`, y agregar `Footer`. Verificación: `/` muestra navbar y footer.
4. Crear `components/GameCard.tsx` y `components/Library.tsx` y reemplazar `app/page.tsx` por la biblioteca (hero, búsqueda, chips, grilla, estado vacío, tilt de la tarjeta). Verificación: filtrar por texto y categoría funciona.
5. Crear `app/juegos/[id]/page.tsx` (detalle: portada, tags, estadísticas, leaderboard con `seededScores`, botones JUGAR AHORA y VOLVER AL VAULT) con `notFound()` si el id no existe.
6. Crear `components/AuthForm.tsx` y `app/login/page.tsx` (pestañas Iniciar sesión / Crear cuenta, campo correo solo en registro, entrar, invitado, botones sociales decorativos). Al enviar: `login`, luego redirigir a `/`.
7. Crear `app/salon/page.tsx` y `components/HallOfFame.tsx` (chips por juego, podio, tabla animada, fila "tu mejor marca" solo con sesión, botón volver).
8. Crear `components/GamePlayer.tsx` y `app/juegos/[id]/jugar/page.tsx` (HUD, CRT, pausa, FIN, modal de fin de juego, guardar puntuación, jugar de nuevo, volver al vault, SALIR al detalle).
9. Revisar `app/globals.css` frente a `references/templates/styles.css` y portar cualquier regla faltante. Verificación: `npm run build` y `npm run lint` sin errores.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan con código 0.
- [x] Las 5 rutas (`/`, `/juegos/caida`, `/juegos/caida/jugar`, `/login`, `/salon`) cargan sin errores ni warnings de hidratación en la consola.
- [x] `/juegos/no-existe` y `/juegos/no-existe/jugar` devuelven la página 404.
- [x] La biblioteca muestra los 8 juegos; escribir "caí" deja solo CAÍDA; el chip SHOOTER deja INVASORES y ROCAS; una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [x] Clic en una tarjeta o en JUGAR lleva a `/juegos/[id]` del juego correspondiente.
- [x] El detalle muestra título, descripción larga, tags, `Partidas`, `Mejor global`, dificultad y 10 filas de leaderboard; JUGAR AHORA lleva a `/juegos/[id]/jugar`.
- [x] En el reproductor el puntaje aumenta solo; PAUSA lo detiene y muestra "EN PAUSA"; REANUDAR lo retoma; FIN abre el modal con la puntuación final.
- [x] En el modal, GUARDAR PUNTUACIÓN escribe una entrada en `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA"; JUGAR DE NUEVO reinicia en 0; SALIR lleva al detalle.
- [x] En `/login`, enviar el formulario guarda `av_user` en mayúsculas (máx. 10 caracteres), redirige a `/` y la navbar muestra el nombre; "JUGAR COMO INVITADO" redirige sin guardar usuario.
- [x] Tras recargar la página con sesión iniciada, la navbar sigue mostrando el nombre; al pulsarlo se cierra la sesión y reaparece "Iniciar Sesión".
- [x] `/salon` muestra podio y 12 filas; cambiar de chip cambia las filas; la fila "TU MEJOR MARCA" aparece solo con sesión.
- [x] En ancho ≤ 480 px el botón `≡` abre el panel móvil con los enlaces y el backdrop lo cierra.
- [x] El enlace "Biblioteca" de la navbar aparece activo en `/`, `/juegos/*` y `/juegos/*/jugar`; "Salón de la Fama" en `/salon`.

## Decisiones tomadas y descartadas

- **Sí:** App Router con rutas reales. Da URLs compartibles y es lo idiomático en Next 16.
- **No:** SPA con hash como el template. Ignora el router de Next y bloquea SSR y metadata por página.
- **Sí:** sesión falsa en `localStorage` (`av_user`) expuesta con Context. Replica el comportamiento del template sin backend.
- **No:** formularios sin estado de sesión. No permitirían ver el navbar autenticado ni la fila "tu mejor marca".
- **Sí:** reproductor simulado con modal y guardado en `av_scores`. Deja listo el flujo que usarán los juegos reales.
- **No:** guardar puntuaciones en un servidor. Backend es otra spec.
- **Sí:** reutilizar las clases CSS ya portadas en `app/globals.css`. Máxima fidelidad con el template y trabajo ya hecho.
- **No:** reescribir con utilidades Tailwind. Riesgo de divergir del diseño sin beneficio.
- **Sí:** datos simulados en `lib/` con tipos. Sirven de contrato para una futura API.
- **Sí:** el "Arcade Bot" del pedido se interpreta como "Arcade Vault" (nombre del proyecto y del template).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Desajuste de hidratación al leer `localStorage` (usuario en navbar) | Estado inicial `null` y lectura en `useEffect`; la navbar renderiza "Iniciar Sesión" hasta montar. |
| `toLocaleString("es-ES")` distinto entre servidor y navegador | Verificar consola; si aparece warning, formatear con `Intl.NumberFormat("es-ES")` instanciado una vez en `lib/`. |
| `localStorage` bloqueado (modo privado) | Todo acceso dentro de `try/catch`; la app funciona sin persistir. |
| API de Next 16 distinta a lo que se conoce (p. ej. `params` asíncrono) | Leer las guías de `node_modules/next/dist/docs` antes de escribir las rutas. |

## Qué **no** está en esta spec

- Ningún juego real (lógica, canvas, input).
- Backend, autenticación real u OAuth.
- Salón de la fama o detalle alimentados por `av_scores`.
- Créditos dinámicos.
- Tests automatizados.
- Idiomas distintos del español.

Cada uno de esos puntos, si se aborda, va en su propia spec.
