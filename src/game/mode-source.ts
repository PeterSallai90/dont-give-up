import type { ModeSource } from "../minigames/types";
import type { GameMode } from "./mode";
import type { SaveFlow } from "./save-flow";

/**
 * The mode as the minigame session and the settings panel see it. With a running game the flow
 * holds the only copy (ADR 0002 section 3); before that, only the start-screen pick is kept.
 */
export class GameModeSource implements ModeSource {
  private flow: SaveFlow | undefined;
  private picked: GameMode | undefined;

  /** From now on flow.mode is the only copy. */
  attach(flow: SaveFlow): void {
    this.flow = flow;
    this.picked = undefined;
  }

  /** Drops the flow and the pick: nothing survives into the next new game. */
  reset(): void {
    this.flow = undefined;
    this.picked = undefined;
  }

  /** The start-screen pick, kept until the new game is running. */
  pick(mode: GameMode): void {
    this.picked = mode;
  }

  current(): GameMode | undefined {
    return this.flow?.mode ?? this.picked;
  }

  getMode(): GameMode {
    const mode = this.current();
    if (mode === undefined) throw new Error("no mode");
    return mode;
  }

  /** Never rejects: a failed write is silent and the in-memory mode applies. */
  async change(mode: GameMode): Promise<void> {
    if (!this.flow) {
      this.picked = mode;
      return;
    }
    try {
      await this.flow.setMode(mode);
    } catch {
      // the in-memory mode already applies
    }
  }
}
