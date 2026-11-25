"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Game } from "@/lib/games";
import type { MeteoroStats } from "@/lib/meteoro/engine";
import { useSession } from "@/lib/session";
import { PLAYABLE, type PlayableGameHandle } from "@/components/games/registry";
const SCORES_KEY = "av_scores";
const LIVES = 3;
const POINTS_PER_LEVEL = 2500;
const INITIAL_STATS: MeteoroStats = {
  score: 0,
  lives: LIVES,
  level: 1,
  tripleShot: 0,
};
const CONTROLS: { keys: string[]; action: string }[] = [
  { keys: ["←", "→"], action: "Rotar la nave" },
  { keys: ["↑"], action: "Propulsar" },
  { keys: ["ESPACIO"], action: "Disparar" },
];
function saveScore(entry: { game: string; score: number; name: string }) {
  try {
    const all = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {
    // localStorage bloqueado o JSON inválido: no se persiste.
  }
}
// true en dispositivos táctiles sin puntero fino (sin teclado físico previsible).
const COARSE_QUERY = "(pointer: coarse)";
function subscribeCoarse(cb: () => void) {
  const mq = window.matchMedia(COARSE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useCoarsePointer() {
  return useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(COARSE_QUERY).matches,
    () => false,
  );
}
function blurActive() {
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();
}
export default function GamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  const Playable = PLAYABLE[game.id];
  const isReal = Playable !== undefined;
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Solo juego real
  const gameRef = useRef<PlayableGameHandle>(null);
  const [started, setStarted] = useState(false);
  const [stats, setStats] = useState<MeteoroStats>(INITIAL_STATS);
  const [finalScore, setFinalScore] = useState(0);
  const coarse = useCoarsePointer();
  const name = typedName ?? user?.name ?? "INVITADO";
  const shownScore = isReal ? stats.score : score;
  const level = isReal ? stats.level : 1 + Math.floor(score / POINTS_PER_LEVEL);
  const lives = isReal ? stats.lives : LIVES;
  const modalScore = isReal ? finalScore : score;
  // Simulación (juegos sin motor real)
  useEffect(() => {
    if (isReal || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [isReal, over, paused]);
  // Next conserva el estado de la ruta al salir y volver (Activity), pero el motor
  // se destruye al ocultarse y vuelve en reposo: reiniciamos a la pantalla de inicio.
  useEffect(() => {
    if (!isReal) return;
    return () => {
      setStarted(false);
      setPaused(false);
      setOver(false);
      setSaved(false);
      setStats(INITIAL_STATS);
    };
  }, [isReal]);
  const startReal = () => {
    blurActive();
    setStats(INITIAL_STATS);
    setPaused(false);
    setStarted(true);
    gameRef.current?.start();
  };
  // Pantalla de inicio: Espacio arranca la partida.
  useEffect(() => {
    if (!isReal || started || coarse) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA")
      )
        return;
      e.preventDefault();
      startReal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const finish = () => {
    if (isReal) setFinalScore(gameRef.current?.end() ?? stats.score);
    setPaused(false);
    setOver(true);
  };
  const onGameOver = (s: number) => {
    setFinalScore(s);
    setPaused(false);
    setOver(true);
  };
  const restart = () => {
    setScore(0);
    setPaused(false);
    setOver(false);
    setSaved(false);
    if (isReal) startReal();
  };
  const playing = !isReal || (started && !over);
  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{shownScore.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v" aria-label={`${lives} de ${LIVES} vidas`}>
              {"♥ ".repeat(lives)}
              <span className="lost">{"♡ ".repeat(LIVES - lives)}</span>
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
          {isReal && stats.tripleShot > 0 && (
            <div className="hud-stat power" aria-live="polite">
              <div className="l">Núcleo</div>
              <div className="v">3x · {stats.tripleShot.toFixed(1)}s</div>
            </div>
          )}
        </div>
        <div className="hud-actions">
          <button
            className="btn yellow"
            disabled={!playing}
            onClick={(e) => {
              if (isReal) e.currentTarget.blur();
              setPaused((p) => !p);
            }}
          >
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" disabled={!playing} onClick={finish}>
            FIN
          </button>
          <Link className="btn ghost" href={`/juegos/${game.id}`}>
            SALIR
          </Link>
        </div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          {isReal ? (
            <Playable
              ref={gameRef}
              paused={paused}
              onStats={setStats}
              onGameOver={onGameOver}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {isReal && !started && (
            <div className="crt-content start-screen">
              {coarse ? (
                <div className="needs-keyboard">
                  <div className="pixel">REQUIERE TECLADO</div>
                  <p>
                    Este juego se controla con flechas y barra espaciadora.
                    Ábrelo en un ordenador con teclado.
                  </p>
                </div>
              ) : (
                <button type="button" className="start-hit" onClick={startReal}>
                  <span className="pixel start-cta">PULSA ESPACIO</span>
                  <span className="start-sub">o haz clic en la pantalla</span>
                  <span className="controls">
                    {CONTROLS.map((c) => (
                      <span className="control-row" key={c.action}>
                        <span className="control-keys">
                          {c.keys.map((k) => (
                            <kbd key={k} className="keycap">
                              {k}
                            </kbd>
                          ))}
                        </span>
                        <span className="control-action">{c.action}</span>
                      </span>
                    ))}
                  </span>
                </button>
              )}
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{modalScore.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setTypedName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={() => {
                    saveScore({ game: game.id, score: modalScore, name });
                    setSaved(true);
                  }}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link className="btn magenta" href="/biblioteca">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
