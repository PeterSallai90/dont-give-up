import type { GameMode } from "./mode";
import type { GameShell } from "./boot";

export type MenuView = "closed" | "panel" | "confirm";

export interface SettingsMenuDeps {
  shell: GameShell;
  onPanelOpen?(): void;
  onPanelClose?(): void;
  /** Called after every state change, so a view can redraw. */
  onChange?(): void;
}

/** State of the settings panel and its confirmation. No DOM. */
export class SettingsMenu {
  private current: "closed" | "panel" | "confirm" = "closed";

  constructor(private readonly deps: SettingsMenuDeps) {}

  get view(): MenuView {
    return this.current;
  }

  /** The settings button exists only while a game runs. */
  get available(): boolean {
    return this.deps.shell.hasGame;
  }

  get showNewGame(): boolean {
    return this.deps.shell.hasGame;
  }

  get mode(): GameMode | undefined {
    return this.deps.shell.modeSource.current();
  }

  open(): void {
    if (this.current !== "closed" || !this.available) return;
    this.current = "panel";
    this.deps.onPanelOpen?.();
    this.deps.onChange?.();
  }

  close(): void {
    if (this.current === "closed") return;
    this.current = "closed";
    this.deps.onPanelClose?.();
    this.deps.onChange?.();
  }

  setMode(mode: GameMode): void {
    void this.deps.shell.modeSource.change(mode);
    this.deps.onChange?.();
  }

  askNewGame(): void {
    if (this.current !== "panel" || !this.showNewGame) return;
    this.current = "confirm";
    this.deps.onChange?.();
  }

  keepPlaying(): void {
    this.close();
  }

  async confirmNewGame(): Promise<void> {
    this.close();
    await this.deps.shell.newGame();
    this.deps.onChange?.();
  }
}
