import type { Language } from "../i18n";
import type { KeyValueStorage } from "../platform/storage";
import type { StoryStep } from "../story/runner";
import type { GameMode } from "./mode";
import { GameModeSource } from "./mode-source";
import { SaveFlow, type SaveFlowDeps } from "./save-flow";
import { SaveStore } from "./save-store";
import { createStorageGate, type StorageGate } from "./storage-gate";

export type OnGameReady = (flow: SaveFlow, step?: StoryStep) => void;
export type ShellState = "booting" | "start" | "starting" | "running";

export interface ShellDeps {
  storage: KeyValueStorage;
  key: string;
  buildIds: Record<Language, string>;
  loadStory(lang: Language): Promise<string | object>;
  /** The language a new game starts in. */
  language(): Language;
  applyLanguage(lang: Language): void;
  onStart(): void;
  onGameReady: OnGameReady;
  onGameDropped?(flow: SaveFlow): void;
  now?: () => Date;
}

/** Boot wiring and the new-game flow. No rendering. */
export class GameShell {
  readonly modeSource = new GameModeSource();
  private current: SaveFlow | undefined;
  private gate: StorageGate;
  private phase: ShellState = "booting";

  constructor(private readonly deps: ShellDeps) {
    this.gate = createStorageGate(deps.storage);
  }

  get state(): ShellState {
    return this.phase;
  }

  get flow(): SaveFlow | undefined {
    return this.current;
  }

  /** The New game predicate: a game is running. */
  get hasGame(): boolean {
    return this.current !== undefined;
  }

  private makeStore(storage: KeyValueStorage): SaveStore {
    return new SaveStore({
      storage,
      key: this.deps.key,
      buildIds: this.deps.buildIds,
      ...(this.deps.now ? { now: this.deps.now } : {}),
    });
  }

  private flowDeps(): SaveFlowDeps {
    return {
      store: this.makeStore(this.gate.storage),
      loadStory: (lang) => this.deps.loadStory(lang),
    };
  }

  async boot(): Promise<void> {
    const booted = await SaveFlow.boot(this.flowDeps());
    if (booted.kind === "resume") {
      this.deps.applyLanguage(booted.flow.language);
      this.current = booted.flow;
      this.modeSource.attach(booted.flow);
      this.phase = "running";
      this.deps.onGameReady(booted.flow, booted.step);
    } else {
      this.phase = "start";
      this.deps.onStart();
    }
  }

  /** The start-screen pick. False: ignored or failed (the cards stay usable). */
  async pick(mode: GameMode): Promise<boolean> {
    if (this.phase !== "start") return false;
    this.phase = "starting";
    this.modeSource.pick(mode);
    this.gate.revoke();
    this.gate = createStorageGate(this.deps.storage);
    try {
      const flow = await SaveFlow.newGame(this.flowDeps(), this.deps.language(), mode);
      this.current = flow;
      this.modeSource.attach(flow);
      this.phase = "running";
      this.deps.onGameReady(flow);
      return true;
    } catch {
      this.gate.revoke();
      this.modeSource.reset();
      this.phase = "start";
      return false;
    }
  }

  /** The confirmed "Start a new game". */
  async newGame(): Promise<void> {
    const old = this.current;
    if (this.phase !== "running" || !old) return;
    this.gate.revoke();
    this.current = undefined;
    this.deps.onGameDropped?.(old);
    this.modeSource.reset();
    this.phase = "start";
    this.gate = createStorageGate(this.deps.storage);
    await this.makeStore(this.deps.storage).clear();
    this.deps.onStart();
  }
}
