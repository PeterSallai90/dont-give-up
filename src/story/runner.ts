import { Story } from "inkjs";
import { advance, MinigameTagError, type StoryLine } from "./advance";
import { isBand, type Band } from "./bands";
import { parseMinigameTag } from "./minigame-tag";

export type { StoryLine } from "./advance";

export interface StoryStep {
  /** Lines produced since the last choice, each with its own tags. */
  lines: StoryLine[];
  choices: { index: number; text: string }[];
  ended: boolean;
  /** Set only on a trigger step: the minigame id from the "minigame: <id>" tag. */
  minigame?: string;
  /** Set with minigame: the ink state JSON at the tag. */
  checkpoint?: string;
}

/** Thin wrapper over an inkjs Story so the game never talks to ink directly. */
export class StoryRunner {
  private readonly story: Story;
  private pending: string | null = null;
  private failure: Error | null = null;

  constructor(compiledJson: string | object) {
    this.story = new Story(
      typeof compiledJson === "string" ? compiledJson : JSON.stringify(compiledJson),
    );
  }

  private fail(message: string): never {
    this.failure = new Error(message);
    throw this.failure;
  }

  private hasMinigameVariable(id: string): boolean {
    return this.story.variablesState.GlobalVariableExistsWithName(`mg_${id}`);
  }

  next(): StoryStep {
    if (this.failure) throw this.failure;
    if (this.pending !== null) throw new Error(`minigame pending: ${this.pending}`);
    let result;
    try {
      result = advance(this.story);
    } catch (e) {
      if (e instanceof MinigameTagError) this.fail(e.message);
      throw e;
    }
    const { lines, stop } = result;
    if (stop.kind === "trigger") {
      if (!this.hasMinigameVariable(stop.id)) {
        this.fail(`minigame "${stop.id}" has no ink variable mg_${stop.id}`);
      }
      this.pending = stop.id;
      const checkpoint = this.snapshot();
      return { lines, choices: [], ended: false, minigame: stop.id, checkpoint };
    }
    const choices = this.story.currentChoices.map((c) => ({ index: c.index, text: c.text }));
    return { lines, choices, ended: !this.story.canContinue && choices.length === 0 };
  }

  choose(index: number): void {
    if (this.failure) throw this.failure;
    if (this.pending !== null) throw new Error(`minigame pending: ${this.pending}`);
    this.story.ChooseChoiceIndex(index);
  }

  /** Writes the band to mg_<id> and clears the pending trigger in one call. */
  completeMinigame(band: Band): void {
    if (this.failure) throw this.failure;
    if (this.pending === null) throw new Error("no minigame is pending");
    if (!isBand(band)) throw new Error(`not a band: ${String(band)}`);
    this.closeLookAhead();
    this.story.variablesState.$(`mg_${this.pending}`, band);
    this.pending = null;
  }

  /**
   * Commits the open inkjs look-ahead (left by ContinueSingleStep after a newline), so variable
   * writes and visit counts are in the state that ToJson writes. Safe at every stop: readLine
   * resets the output before each line, so no glue crosses a stop.
   */
  private closeLookAhead(): void {
    this.story.DiscardSnapshot();
  }

  /** The ink state JSON of the current position, including every write made so far. */
  snapshot(): string {
    this.closeLookAhead();
    return this.story.state.ToJson();
  }

  /** Restores the ink state saved at a trigger; the runner is unchanged if this throws. */
  restore(checkpoint: string, pending: string): StoryStep {
    if (this.failure) throw this.failure;
    const tag = parseMinigameTag([`minigame: ${pending}`]);
    if (tag.kind !== "trigger" || tag.id !== pending) {
      throw new Error(`not a valid minigame id: ${pending}`);
    }
    if (!this.hasMinigameVariable(pending)) {
      throw new Error(`minigame "${pending}" has no ink variable mg_${pending}`);
    }
    const snapshot = this.snapshot();
    try {
      this.story.state.LoadJson(checkpoint);
    } catch (e) {
      this.story.state.LoadJson(snapshot);
      throw e;
    }
    this.pending = pending;
    return { lines: [], choices: [], ended: false, minigame: pending, checkpoint };
  }

  getVariable(name: string): unknown {
    return this.story.variablesState.$(name);
  }

  setVariable(name: string, value: string | number | boolean): void {
    this.story.variablesState.$(name, value);
  }
}
