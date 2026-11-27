import { GAME_MODES, type GameMode } from "../minigames/types";

export { GAME_MODES, type GameMode };

export function isGameMode(v: unknown): v is GameMode {
  return typeof v === "string" && (GAME_MODES as readonly string[]).includes(v);
}
