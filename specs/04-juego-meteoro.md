# SPEC 04 — Juego METEORO (primer juego real)

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-25
> **Objective:** Portar el juego de asteroides de `references/started-games/02-asteroids/` a un motor TypeScript montado en canvas como el nuevo juego jugable `METEORO` (`/juegos/meteoro/jugar`), integrado con el HUD, la pausa, el modal de fin y el guardado en `av_scores` de la plataforma.

## Por qué existe esta spec

Hasta hoy ningún juego es real: `GamePlayer` simula la puntuación con un `setInterval` sobre una arena CSS falsa. El juego de referencia ya existe y funciona, pero es un `game.js` suelto (globals, `getElementById("canvas")`, listeners en `window` nunca retirados, HUD y GAME OVER dibujados en el canvas, estilo blanco vectorial) que no sobrevive a la navegación SPA ni habla con React.

Esta spec deja el patrón que seguirán los siguientes juegos (`03-tetris`, `04-arkanoid`): motor TS sin globals + registro por id + HUD de plataforma.

## Alcance

**Dentro:**

- Nueva entrada `meteoro` en `GAMES`, **primera** del array: título `METEORO`, categoría `SHOOTER`, color `cyan`, portada CSS nueva `cover-meteoro`, textos `short`/`long` propios, `best` y `plays` simulados.
- Motor TypeScript en `lib/meteoro/engine.ts`, port 1:1 de la mecánica de `game.js`: física de la nave, envolvimiento toroidal, rocas de 3 tamaños que se parten, puntos 20/50/100, partículas, 3 vidas con invencibilidad parpadeante al reaparecer, niveles con `3 + nivel` rocas, power-up de triple disparo (`3x`, 5 s, caída 15 % o garantizada a la 5.ª destrucción, uno por nivel).
- Motor sin globals: estado encapsulado, listeners de teclado añadidos al iniciar y retirados en `destroy()`, `requestAnimationFrame` cancelado en `destroy()`.
- Restyle neón: colores de la paleta (`--cyan`, `--magenta`, `--yellow`, `--green`) con glow (`shadowBlur`) en nave, rocas, balas, power-up y partículas.
- Se eliminan del canvas el HUD y el overlay GAME OVER: el motor emite estado por callbacks.
- Client Component `components/games/MeteoroGame.tsx` que monta el canvas (resolución interna 800×600, escalado CSS al 100 % del `.crt-screen` 4:3) y expone el motor a `GamePlayer`.
- Registro `components/games/registry.ts`: mapa `id → componente`, solo `meteoro` por ahora.
- `GamePlayer`: si el id está en el registro monta el juego real; si no, mantiene la simulación actual sin cambios.
- Con juego real, el HUD React muestra puntuación, vidas (corazones según vidas restantes), nivel y el indicador `3x · N.Ns` mientras dure el power-up. `PAUSA`/`REANUDAR` pausan el motor; `FIN` termina la partida y abre el modal; el game over real abre el mismo modal; `JUGAR DE NUEVO` reinicia el motor.
- Pantalla de inicio sobre el CRT: "PULSA ESPACIO" + tabla de controles; la partida empieza con Espacio o clic en la pantalla.
- Aviso "REQUIERE TECLADO" en dispositivos táctiles sin teclado (`(pointer: coarse)`), en lugar de la pantalla de inicio.
- Badge `JUGABLE` en `GameCard` y en la página de detalle para los ids del registro.
- Guardado de la puntuación final en `av_scores` con el modal existente (mismo formato que hoy).
- Actualizar `CLAUDE.md` (motor, registro, patrón para nuevos juegos).

**Fuera de alcance (specs futuras):**

- Guardar puntuaciones en Supabase (tabla, escritura, lectura): spec de puntuaciones.
- Controles táctiles en pantalla.
- Portar `03-tetris` y `04-arkanoid`: una spec por juego, con este patrón.
- Sonido.
- Mejor puntuación real del jugador en tarjetas, detalle o salón: siguen los valores fijos y `seededScores`.
- Cambios en el juego simulado `ROCAS` (se mantiene en el catálogo, simulado).
- Mecánicas nuevas (OVNIs, hiperespacio, escudos) o cambios de balance.
- Tests automatizados.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada, primera del array
{
  id: "meteoro",
  title: "METEORO",
  short: "Esquiva y pulveriza meteoros en gravedad cero.",
  long: "Tu nave flota en un campo de meteoros que no deja de crecer. Rota, propulsa y dispara para partirlos en fragmentos cada vez más pequeños. Atrapa el núcleo 3x para disparar en abanico.",
  cat: "SHOOTER",
  cover: "cover-meteoro",
  color: "cyan",
  best: 12500,
  plays: "1.2K",
}

// lib/meteoro/engine.ts
export type MeteoroStats = {
  score: number;
  lives: number;       // 0..3
  level: number;       // 1..
  tripleShot: number;  // segundos restantes del power-up, 0 si inactivo
};

export type MeteoroCallbacks = {
  onStats: (stats: MeteoroStats) => void;   // solo cuando algún valor cambia (tripleShot redondeado a 0.1)
  onGameOver: (finalScore: number) => void; // lives llega a 0
};

export type MeteoroEngine = {
  start(): void;    // nueva partida (score 0, 3 vidas, nivel 1) y arranca el loop
  pause(): void;    // congela update; sigue dibujando el último frame
  resume(): void;
  end(): number;    // detiene la partida y devuelve la puntuación actual
  destroy(): void;  // cancela RAF y retira listeners
};

export declare function createMeteoroEngine(
  canvas: HTMLCanvasElement,
  callbacks: MeteoroCallbacks,
): MeteoroEngine;

// components/games/registry.ts
export type PlayableGameProps = {
  paused: boolean;
  onStats: (stats: MeteoroStats) => void;
  onGameOver: (finalScore: number) => void;
  // más un handle (ref) con start/end para GamePlayer
};
export const PLAYABLE: Record<string, React.ComponentType<PlayableGameProps>>; // { meteoro: MeteoroGame }
export declare function isPlayable(id: string): boolean;
```

Convenciones:

- Constantes de juego (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`, física de la nave) con los mismos valores que `game.js`.
- Teclas: `ArrowLeft`/`ArrowRight` rotar, `ArrowUp` propulsar, `Space` disparar. El motor hace `preventDefault` de esas teclas (evita scroll) y las ignora si el foco está en un `input`/`textarea` (modal de iniciales).
- `dt` limitado a 50 ms, como el original.
- `av_scores`: sin cambios de formato (`{ game: "meteoro", score, name, at }`).

## Plan de implementación

Antes del paso 1: leer en `node_modules/next/dist/docs/01-app` las guías de Client Components y de `"use client"` (según `AGENTS.md`).

1. **Catálogo y portada.** Agregar `meteoro` primero en `GAMES` y la clase `cover-meteoro` en `app/globals.css` (fondo espacial, rocas neón y nave cian, en el estilo de las portadas existentes). Verificación: `/biblioteca` muestra METEORO primero; `/juegos/meteoro` y `/juegos/meteoro/jugar` (aún simulado) responden; `npm run build` sin errores.
2. **Motor.** Crear `lib/meteoro/engine.ts` portando `game.js` a TS con la API del modelo de datos, sin HUD ni overlay en canvas, con la paleta neón. Verificación: `npx tsc --noEmit` y `npm run lint` sin errores.
3. **Componente y registro.** Crear `components/games/MeteoroGame.tsx` (canvas 800×600 escalado, crea el motor en `useEffect`, `destroy()` en el cleanup, sincroniza `paused`) y `components/games/registry.ts`. Verificación: `npx tsc --noEmit` sin errores.
4. **Integración en `GamePlayer`.** Si `isPlayable(game.id)`: montar el juego real en `.crt-screen` en lugar de `.game-arena`, desactivar el `setInterval`, alimentar el HUD con `onStats` (vidas e indicador `3x`), conectar PAUSA/FIN/JUGAR DE NUEVO y `onGameOver` → modal. Pantalla de inicio "PULSA ESPACIO" con controles y aviso "REQUIERE TECLADO" en `(pointer: coarse)`. Verificación: partida completa en `/juegos/meteoro/jugar` hasta guardar en `av_scores`; `/juegos/caida/jugar` sigue simulado.
5. **Badge.** Badge `JUGABLE` en `GameCard` y en `/juegos/[id]` para ids del registro, con su CSS en `globals.css`. Verificación: solo METEORO lo muestra.
6. **Cierre.** Actualizar `CLAUDE.md`. Verificación: `npm run build` y `npm run lint` con código 0 y checklist de aceptación en navegador.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan con código 0.
- [x] `GAMES[0].id === "meteoro"`; aparece primero en `/biblioteca` (filtros TODOS y SHOOTER) y en el rail de la landing.
- [x] `/juegos/meteoro` muestra la portada `cover-meteoro` y el badge `JUGABLE`; ningún otro juego muestra el badge.
- [x] `/juegos/meteoro/jugar` muestra la pantalla "PULSA ESPACIO" con los controles; la partida no arranca hasta pulsar Espacio o hacer clic.
- [x] Flechas rotan/propulsan y Espacio dispara; las flechas y Espacio no hacen scroll de la página.
- [x] Destruir rocas grande/mediana/pequeña suma 20/50/100 en el HUD React; las rocas grandes y medianas se parten en dos.
- [x] Al chocar se pierde una vida (los corazones del HUD bajan), la nave reaparece al centro parpadeando e invencible.
- [x] Al vaciar el campo el nivel del HUD sube y aparecen `3 + nivel` rocas grandes.
- [x] Recoger el power-up muestra `3x` con cuenta atrás en el HUD y dispara tres balas en abanico durante 5 s.
- [x] El canvas no dibuja HUD ni texto GAME OVER; nave, rocas, balas y power-up usan colores neón de la paleta.
- [x] PAUSA congela el juego y muestra el overlay "EN PAUSA"; REANUDAR continúa sin saltos.
- [x] Perder la última vida o pulsar FIN abre el modal con la puntuación real; GUARDAR añade `{ game: "meteoro", score, name, at }` a `av_scores`.
- [x] Escribir iniciales en el modal no dispara ni mueve la nave.
- [x] JUGAR DE NUEVO reinicia con puntuación 0, 3 vidas y nivel 1.
- [x] Salir a otra ruta y volver no duplica el loop ni los listeners (velocidad normal, un disparo por pulsación).
- [x] En emulación táctil (`pointer: coarse`) se muestra "REQUIERE TECLADO".
- [x] El canvas ocupa el `.crt-screen` completo sin deformarse en desktop y en anchos de móvil.
- [x] `/juegos/caida/jugar` y el resto de juegos siguen con el jugador simulado igual que en SPEC 02.
- [x] `CLAUDE.md` menciona `lib/meteoro/engine.ts`, `components/games/registry.ts` y el patrón para agregar juegos reales.

## Decisiones tomadas y descartadas

- **Sí:** nueva entrada `meteoro` en vez de reemplazar `rocas`. Decisión del usuario; ROCAS queda simulado.
- **Sí:** nombre propio `METEORO`. La plataforma usa nombres en español y no se usa el nombre del arcade comercial.
- **No:** `CINTURÓN` / `GRAVEDAD CERO`. Descartados en favor de METEORO.
- **Sí:** motor TS sin globals + Client Component con canvas. Limpia RAF y listeners al desmontar y habla con React por callbacks.
- **No:** `game.js` en `public/` con `iframe`. Sin comunicación limpia de puntuación/pausa con la plataforma.
- **No:** `game.js` cargado con `<Script>`. Globals y `getElementById` rompen con navegación SPA y remontajes.
- **Sí:** HUD, pausa y modal de la plataforma. Experiencia uniforme con el resto de juegos; el canvas solo dibuja el juego.
- **No:** HUD y GAME OVER internos del canvas.
- **Sí:** paleta neón de Arcade Vault. Coherente con la plataforma y con identidad visual propia.
- **No:** blanco vectorial del original.
- **Sí:** mecánica 1:1 incluido el power-up 3x. Solo cambia la integración y el color.
- **Sí:** registro `id → componente` + badge `JUGABLE`. Escala a los siguientes juegos sin tocar el tipo `Game`.
- **No:** campo `playable` en `Game`. Duplicaría la fuente de verdad del registro.
- **Sí:** pantalla "PULSA ESPACIO". Garantiza foco de teclado antes de empezar.
- **No:** arranque inmediato al montar.
- **Sí:** puntuación en `av_scores` con el modal existente. Supabase va en la spec de puntuaciones.
- **No:** guardar en Supabase ya. Abre el dominio de base de datos.
- **Sí:** solo teclado, con aviso en táctiles. Controles táctiles van en otra spec.
- **Sí:** `best`/`plays` simulados como el resto del catálogo.
- **Sí:** portada CSS nueva y primera posición en `GAMES`. Visible en la landing; consecuencia aceptada: `ROCAS` sale del rail `GAMES.slice(0, 6)`.

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Doble montaje de efectos en dev (Strict Mode) duplica loop o listeners | `destroy()` idempotente en el cleanup de `useEffect`; criterio de aceptación de navegar y volver. |
| `onStats` a 60 fps provoca renders excesivos de `GamePlayer`           | Emitir solo cuando cambia algún valor (`tripleShot` redondeado a 0.1).                            |
| Espacio/flechas hacen scroll o activan botones con foco                | `preventDefault` en el motor; quitar foco de botones al iniciar partida.                          |
| Teclas del modal (iniciales) llegan al motor                           | Ignorar eventos con foco en `input`/`textarea`; el motor está detenido tras `end()`/game over.    |
| `shadowBlur` (glow) baja los fps en equipos lentos                     | Glow solo en contornos y balas, no en partículas masivas; revisar fluidez en el paso 4.           |
| Pestaña en segundo plano provoca salto de `dt`                         | `dt` limitado a 50 ms como el original.                                                           |
| Canvas usa APIs de navegador durante el render del servidor            | Todo acceso a `canvas`/`window` dentro de `useEffect` en un Client Component.                     |

## Qué **no** está en esta spec

- Puntuaciones en Supabase.
- Controles táctiles y sonido.
- Port de Tetris y Arkanoid.
- Mejores puntuaciones reales en tarjetas, detalle o salón.
- Cambios en ROCAS o en los demás juegos simulados.
- Tests automatizados.

Cada uno de esos puntos, si se aborda, va en su propia spec.
