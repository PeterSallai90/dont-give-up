import { describe, expect, it } from "vitest";
import { StoryRunner } from "../src/story/runner";
import { compileLanguage } from "../tools/ink";

function runner(lang: string): StoryRunner {
  const { story } = compileLanguage(lang);
  if (!story) throw new Error(`story for ${lang} did not compile`);
  return new StoryRunner(story.ToJson() ?? "");
}

describe("StoryRunner", () => {
  it("offers the first choices and changes a variable when one is chosen", () => {
    const r = runner("en");
    const first = r.next();
    expect(first.choices.length).toBeGreaterThan(1);
    const warmthBefore = Number(r.getVariable("warmth"));
    r.choose(0);
    r.next();
    expect(Number(r.getVariable("warmth"))).toBeGreaterThan(warmthBefore);
  });

  it("restores a saved state", () => {
    const r = runner("en");
    r.next();
    const saved = r.save();
    r.choose(1);
    r.next();
    r.load(saved);
    expect(r.next().choices.length).toBeGreaterThan(1);
  });
});
