import type { Band } from "../story/bands";

export const GAME_MODES = ["easy", "normal"] as const;
export type GameMode = (typeof GAME_MODES)[number];

/** The id from "# minigame: <id>", as StoryStep.minigame gives it. */
export type MinigameId = string;

export interface MinigameInput {
  readonly id: MinigameId;
  readonly params: Readonly<Record<string, string | number | boolean>>;
}

/** M1: the band only. */
export interface MinigameResult {
  readonly band: Band;
}

export interface MinigameModule {
  play(input: MinigameInput, mode: GameMode, ready: () => void): Promise<MinigameResult>;
}

export interface MinigameRegistry {
  get(id: MinigameId): MinigameModule | undefined;
}

export interface ModeSource {
  getMode(): GameMode;
}
