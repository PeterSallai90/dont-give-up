import { describe, expect, it } from "vitest";
import type { Story } from "inkjs";
import { advance, MinigameTagError, readLine } from "../src/story/advance";
import { compileSource } from "../tools/ink";

function story(source: string): Story {
  const { story: s, errors } = compileSource(source);
  if (!s) throw new Error(`fixture did not compile: ${errors.join("; ")}`);
  return s;
}

const FIRE = `
VAR mg_fire = ""
The lodge is cold.
She holds the match. # minigame: fire
{mg_fire == "good": The fire roars.}
-> END
`;

describe("advance: the shared stop rule (AC 1)", () => {
  it("stops on the end-of-line trigger and returns the lead-in lines", () => {
    const s = story(FIRE);
    const result = advance(s);
    expect(result.stop).toEqual({ kind: "trigger", id: "fire" });
    expect(result.lines.map((l) => l.text)).toEqual(["The lodge is cold.", "She holds the match."]);
    expect(result.lines[1]?.tags).toContain("minigame: fire");
  });

  it("reads one line at a time with readLine, without looking ahead", () => {
    const s = story(FIRE);
    const first = readLine(s);
    expect(first.text).toBe("The lodge is cold.");
    expect(first.tags).toEqual([]);
  });

  it("stops at choices and at the end", () => {
    expect(advance(story("Hello.\n+ [A] -> END\n")).stop).toEqual({ kind: "choices" });
    expect(advance(story("Hello.\n-> END\n")).stop).toEqual({ kind: "end" });
  });

  it("stops with kind limit when maxLines is reached", () => {
    const result = advance(story("One.\nTwo.\nThree.\n-> END\n"), 2);
    expect(result.stop).toEqual({ kind: "limit" });
    expect(result.lines.length).toBeLessThanOrEqual(2);
  });
});

describe("advance: malformed tags (AC 3)", () => {
  it("throws MinigameTagError on two minigame tags in one line", () => {
    const s = story("-> t\n=== t ===\nHold. # minigame: fire # minigame: patch\n-> END\n");
    expect(() => advance(s)).toThrow(MinigameTagError);
  });

  it("throws MinigameTagError on a minigame tag with no id", () => {
    const s = story("-> t\n=== t ===\nHold. # minigame:\n-> END\n");
    expect(() => advance(s)).toThrow(MinigameTagError);
  });
});
