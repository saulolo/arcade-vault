"use client";
import { useEffect, useImperativeHandle, useRef } from "react";
import { createMeteoroEngine, type MeteoroEngine } from "@/lib/meteoro/engine";
import type { PlayableGameProps } from "./registry";
export default function MeteoroGame({
  paused,
  onStats,
  onGameOver,
  ref,
}: PlayableGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MeteoroEngine | null>(null);
  // Callbacks siempre frescos sin recrear el motor.
  const callbacksRef = useRef({ onStats, onGameOver });
  useEffect(() => {
    callbacksRef.current = { onStats, onGameOver };
  }, [onStats, onGameOver]);
  // El motor vive mientras el componente esté montado; destroy() es idempotente
  // (doble montaje de Strict Mode y navegación SPA no duplican loop ni listeners).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createMeteoroEngine(canvas, {
      onStats: (s) => callbacksRef.current.onStats(s),
      onGameOver: (score) => callbacksRef.current.onGameOver(score),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, []);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);
  useImperativeHandle(
    ref,
    () => ({
      start: () => engineRef.current?.start(),
      end: () => engineRef.current?.end() ?? 0,
    }),
    [],
  );
  return (
    <canvas ref={canvasRef} className="game-canvas" width={800} height={600} />
  );
}
