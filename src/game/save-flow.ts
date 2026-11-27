import type { Language } from "../i18n";
import type { Band } from "../story/bands";
import { StoryRunner, type StoryStep } from "../story/runner";
import type { GameMode } from "./mode";
import { lastScene } from "./scene-tag";
import type { SaveStore } from "./save-store";

export interface SaveFlowDeps {
  store: SaveStore;
  loadStory(lang: Language): Promise<string | object>;
}

export type Boot = { kind: "resume"; flow: SaveFlow; step: StoryStep } | { kind: "start" };

export class SaveFlow {
  private currentMode: GameMode;
  private currentScene: string | undefined;
  private pendingId: string | undefined;

  private constructor(
    private readonly deps: SaveFlowDeps,
    private readonly runner: StoryRunner,
    readonly language: Language,
    mode: GameMode,
    scene: string | undefined,
  ) {
    this.currentMode = mode;
    this.currentScene = scene;
  }

  static async boot(deps: SaveFlowDeps): Promise<Boot> {
    try {
      const save = await deps.store.read();
      const pending = save?.header.pending;
      if (!save || pending === undefined) return { kind: "start" };
      const { language, game_mode: mode, scene } = save.header;
      const story = await deps.loadStory(language);
      // Probe on a throwaway runner: a state that loads but cannot continue is no save.
      const probe = new StoryRunner(story);
      probe.restore(save.ink, pending);
      probe.completeMinigame("poor");
      probe.next();
      const runner = new StoryRunner(story);
      const step = runner.restore(save.ink, pending);
      const flow = new SaveFlow(deps, runner, language, mode, scene);
      flow.pendingId = pending;
      return { kind: "resume", flow, step };
    } catch {
      return { kind: "start" };
    }
  }

  static async newGame(deps: SaveFlowDeps, language: Language, mode: GameMode): Promise<SaveFlow> {
    await deps.store.clear();
    const story = await deps.loadStory(language);
    return new SaveFlow(deps, new StoryRunner(story), language, mode, undefined);
  }

  get mode(): GameMode {
    return this.currentMode;
  }

  get scene(): string | undefined {
    return this.currentScene;
  }

  async setMode(mode: GameMode): Promise<void> {
    this.currentMode = mode;
    await this.deps.store.setMode(mode);
  }

  async next(): Promise<StoryStep> {
    const step = this.runner.next();
    await this.afterStep(step, false);
    return step;
  }

  choose(index: number): void {
    this.runner.choose(index);
  }

  async accept(band: Band): Promise<StoryStep> {
    this.runner.completeMinigame(band);
    this.pendingId = undefined;
    const step = this.runner.next();
    await this.afterStep(step, true);
    return step;
  }

  /** Writes the current ink state at the current stop. */
  async saveNow(): Promise<void> {
    await this.write(this.runner.snapshot());
  }

  private async afterStep(step: StoryStep, clearIfNoTrigger: boolean): Promise<void> {
    this.currentScene = lastScene(step.lines) ?? this.currentScene;
    if (step.minigame !== undefined && step.checkpoint !== undefined) {
      this.pendingId = step.minigame;
      await this.write(step.checkpoint);
    } else if (clearIfNoTrigger) {
      await this.deps.store.clear();
    }
  }

  private write(ink: string): Promise<void> {
    return this.deps.store.write({
      language: this.language,
      game_mode: this.currentMode,
      ...(this.currentScene !== undefined ? { scene: this.currentScene } : {}),
      ...(this.pendingId !== undefined ? { pending: this.pendingId } : {}),
      ink,
    });
  }
}
