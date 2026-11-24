import { Story } from "inkjs";

export interface StoryStep {
  /** Lines of text produced since the last choice. */
  lines: string[];
  /** Tags on those lines, such as "scene: kitchen" or "minigame: firewood". */
  tags: string[];
  choices: { index: number; text: string }[];
  ended: boolean;
}

/** Thin wrapper over an inkjs Story so the game never talks to ink directly. */
export class StoryRunner {
  private readonly story: Story;

  constructor(compiledJson: string | object) {
    this.story = new Story(
      typeof compiledJson === "string" ? compiledJson : JSON.stringify(compiledJson),
    );
  }

  next(): StoryStep {
    const lines: string[] = [];
    const tags: string[] = [];
    while (this.story.canContinue) {
      const line = (this.story.Continue() ?? "").trim();
      if (line) lines.push(line);
      tags.push(...(this.story.currentTags ?? []));
    }
    const choices = this.story.currentChoices.map((c) => ({ index: c.index, text: c.text }));
    return { lines, tags, choices, ended: choices.length === 0 };
  }

  choose(index: number): void {
    this.story.ChooseChoiceIndex(index);
  }

  getVariable(name: string): unknown {
    return this.story.variablesState.$(name);
  }

  setVariable(name: string, value: string | number | boolean): void {
    this.story.variablesState.$(name, value);
  }

  save(): string {
    return this.story.state.ToJson();
  }

  load(saved: string): void {
    this.story.state.LoadJson(saved);
  }
}
