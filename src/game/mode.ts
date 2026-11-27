export const GAME_MODES = ["easy", "normal"] as const;
export type GameMode = (typeof GAME_MODES)[number];

export function isGameMode(v: unknown): v is GameMode {
  return typeof v === "string" && (GAME_MODES as readonly string[]).includes(v);
}
