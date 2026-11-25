import type { ComponentType, Ref } from "react";
import type { MeteoroStats } from "@/lib/meteoro/engine";
import MeteoroGame from "./MeteoroGame";
// Control imperativo que GamePlayer usa sobre el juego real.
export type PlayableGameHandle = {
  start(): void; // nueva partida
  end(): number; // termina la partida y devuelve la puntuación
};
export type PlayableGameProps = {
  paused: boolean;
  onStats: (stats: MeteoroStats) => void;
  onGameOver: (finalScore: number) => void;
  ref?: Ref<PlayableGameHandle>;
};
// id de juego → componente jugable. Los ids ausentes usan el jugador simulado.
export const PLAYABLE: Record<string, ComponentType<PlayableGameProps>> = {
  meteoro: MeteoroGame,
};
export function isPlayable(id: string): boolean {
  return Object.hasOwn(PLAYABLE, id);
}
