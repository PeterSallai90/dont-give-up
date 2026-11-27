import { Story } from "inkjs";
import { isBand, type Band } from "./bands";
import { parseMinigameTag } from "./minigame-tag";

export interface StoryLine {
  text: string;
  tags: string[];
}

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

  /**
   * Reads one line without inkjs look-ahead. Continue() runs on past the end of a line to look
   * for glue and keeps that evaluated content when it prints no text, so a band branch could be
   * decided before the band is written.
   */
  private continueLine(): StoryLine {
    const story = this.story;
    story.state.didSafeExit = false;
    story.state.ResetOutput();
    do {
      story.ContinueSingleStep();
    } while (!story.state.outputStreamEndsInNewline && story.canContinue);
    if (story.hasError) throw new Error(story.currentErrors?.join("; ") ?? "ink runtime error");
    return { text: (story.currentText ?? "").trim(), tags: [...(story.currentTags ?? [])] };
  }

  next(): StoryStep {
    if (this.failure) throw this.failure;
    if (this.pending !== null) throw new Error(`minigame pending: ${this.pending}`);
    const lines: StoryLine[] = [];
    while (this.story.canContinue) {
      const { text, tags } = this.continueLine();
      if (text || tags.length > 0) lines.push({ text, tags });
      const tag = parseMinigameTag(tags);
      if (tag.kind === "error") this.fail(tag.message);
      if (tag.kind === "trigger") {
        if (!this.hasMinigameVariable(tag.id)) {
          this.fail(`minigame "${tag.id}" has no ink variable mg_${tag.id}`);
        }
        this.pending = tag.id;
        const checkpoint = this.story.state.ToJson();
        return { lines, choices: [], ended: false, minigame: tag.id, checkpoint };
      }
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
    this.story.variablesState.$(`mg_${this.pending}`, band);
    this.pending = null;
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
    const snapshot = this.story.state.ToJson();
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
