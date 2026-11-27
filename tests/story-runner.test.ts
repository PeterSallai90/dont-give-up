import { describe, expect, it } from "vitest";
import type { Band } from "../src/story/bands";
import { StoryRunner } from "../src/story/runner";
import { compileLanguage } from "../tools/ink";
import { runnerFromInk } from "./helpers/ink-fixture";

function runner(lang: string): StoryRunner {
  const { story } = compileLanguage(lang);
  if (!story) throw new Error(`story for ${lang} did not compile`);
  return new StoryRunner(story.ToJson() ?? "");
}

const BANDS_INK = `
{mg_fire == "good": The fire roars.}
{mg_fire == "fair": The fire holds.}
{mg_fire == "poor": The fire sputters.}
`;

const FIRE = `
VAR mg_fire = ""
VAR mg_patch = ""
-> lodge
=== lodge ===
The lodge is cold.
She holds the match. # minigame: fire
${BANDS_INK}
-> after
=== after ===
Morning comes.
+ [Go out] -> END
`;

const TWICE = `
VAR mg_fire = ""
VAR mg_patch = ""
-> lodge
=== lodge ===
She holds the match. # minigame: fire
{mg_fire == "poor": The fire sputters.}
{mg_fire == "fair": The fire holds.}
She lifts the patch. # minigame: patch
{mg_patch == "good": The roof holds.}
-> END
`;

const lines = (s: { lines: { text: string }[] }): string[] => s.lines.map((l) => l.text);

describe("StoryRunner on the real story", () => {
  it("offers the first choices and changes a variable when one is chosen", () => {
    const r = runner("en");
    const first = r.next();
    expect(first.choices.length).toBeGreaterThan(1);
    const warmthBefore = Number(r.getVariable("warmth"));
    r.choose(0);
    r.next();
    expect(Number(r.getVariable("warmth"))).toBeGreaterThan(warmthBefore);
  });
});

describe("AC 1: stop at the trigger", () => {
  it("stops right after the tagged line and returns minigame id with the lead-in lines", () => {
    const r = runnerFromInk(FIRE);
    const step = r.next();
    expect(step.minigame).toBe("fire");
    expect(lines(step)).toEqual(["The lodge is cold.", "She holds the match."]);
    expect(step.choices).toEqual([]);
    expect(r.getVariable("mg_fire")).toBe("");
  });

  it("a story without the tag behaves as before and has no minigame field", () => {
    const r = runnerFromInk("Hello.\n+ [A] -> END\n+ [B] -> END\n");
    const step = r.next();
    expect(step).not.toHaveProperty("minigame");
    expect(step).not.toHaveProperty("checkpoint");
    expect(lines(step)).toEqual(["Hello."]);
    expect(step.choices.map((c) => c.text)).toEqual(["A", "B"]);
    expect(step.ended).toBe(false);
  });

  it("still stops when the trigger is the first line of a stitch", () => {
    const r = runnerFromInk(
      `VAR mg_fire = ""\n-> k.s\n=== k ===\n= s\nShe strikes it. # minigame: fire\nDone.\n-> END\n`,
    );
    const step = r.next();
    expect(step.minigame).toBe("fire");
    expect(lines(step)).toEqual(["She strikes it."]);
  });
});

describe("AC 2: tags per line", () => {
  it("gives { text, tags } with only the tags of that line", () => {
    const r = runnerFromInk(
      "First. # scene: kitchen\nSecond.\nThird. # mood: calm\n+ [Go] -> END\n",
    );
    expect(r.next().lines).toEqual([
      { text: "First.", tags: ["scene: kitchen"] },
      { text: "Second.", tags: [] },
      { text: "Third.", tags: ["mood: calm"] },
    ]);
  });

  it("keeps a line with empty text but with tags, drops one with neither", () => {
    const r = runnerFromInk("-> a\n=== a ===\n# scene: kitchen\n-> b\n=== b ===\nText.\n-> END\n");
    const step = r.next();
    // own-line tag attaches to the next text line, so no empty-text entry here
    expect(step.lines.every((l) => l.text !== "" || l.tags.length > 0)).toBe(true);
    expect(step.lines.length).toBeGreaterThan(0);
  });

  it("has no flat tags list on the step", () => {
    const step = runnerFromInk("Hi. # a: b\n-> END\n").next();
    expect(step).not.toHaveProperty("tags");
  });
});

describe("AC 3: own-line tag", () => {
  it("reports the tag on the next text line (the band line), as inkjs does", () => {
    const r = runnerFromInk(
      `VAR mg_fire = ""\nShe holds the match.\n# minigame: fire\nThe fire sputters.\n-> END\n`,
    );
    const step = r.next();
    expect(step.minigame).toBe("fire");
    expect(step.lines[0]).toEqual({ text: "She holds the match.", tags: [] });
    const last = step.lines[step.lines.length - 1];
    expect(last?.tags).toEqual(["minigame: fire"]);
    expect(last?.text).toBe("The fire sputters.");
  });

  it("stops on a tag-only line when the divert reaches no text line", () => {
    const r = runnerFromInk(`VAR mg_fire = ""\n-> a\n=== a ===\n# minigame: fire\n-> END\n`);
    const step = r.next();
    expect(step.minigame).toBe("fire");
    expect(step.lines).toEqual([{ text: "", tags: ["minigame: fire"] }]);
  });
});

describe("AC 4: ended", () => {
  it("a trigger step has no choices and is not ended", () => {
    const step = runnerFromInk(FIRE).next();
    expect(step.choices).toEqual([]);
    expect(step.ended).toBe(false);
  });

  it("is true only at the real end of the story", () => {
    const r = runnerFromInk(FIRE);
    r.next();
    r.completeMinigame("good");
    const after = r.next();
    expect(after.ended).toBe(false);
    expect(after.choices.length).toBe(1);
    r.choose(0);
    const end = r.next();
    expect(end.ended).toBe(true);
    expect(end.choices).toEqual([]);
    expect(end.minigame).toBeUndefined();
  });
});

describe("AC 5: pending state", () => {
  it("stops even when mg_fire already holds an older band", () => {
    const r = runnerFromInk(FIRE);
    r.setVariable("mg_fire", "good");
    const step = r.next();
    expect(step.minigame).toBe("fire");
    expect(lines(step)).not.toContain("The fire roars.");
  });

  it("next() and choose() throw while pending", () => {
    const r = runnerFromInk(FIRE);
    r.next();
    expect(() => r.next()).toThrow();
    expect(() => r.choose(0)).toThrow();
  });
});

describe("AC 6: atomic completion", () => {
  it("writes the band and the next step continues after the tag", () => {
    const r = runnerFromInk(FIRE);
    r.next();
    r.completeMinigame("fair");
    expect(r.getVariable("mg_fire")).toBe("fair");
    const step = r.next();
    expect(lines(step)).toContain("The fire holds.");
    expect(lines(step)).not.toContain("She holds the match.");
    expect(lines(step)).not.toContain("The fire roars.");
  });

  it("clears pending so the story goes on", () => {
    const r = runnerFromInk(FIRE);
    r.next();
    r.completeMinigame("good");
    expect(() => r.next()).not.toThrow();
  });
});

describe("AC 7: validation and poor", () => {
  it("rejects a band outside the list and writes nothing", () => {
    const r = runnerFromInk(FIRE);
    r.next();
    expect(() => r.completeMinigame("" as Band)).toThrow();
    expect(() => r.completeMinigame("great" as Band)).toThrow();
    expect(r.getVariable("mg_fire")).toBe("");
    expect(() => r.next()).toThrow(); // still pending
    r.completeMinigame("poor"); // and still completable
    expect(r.getVariable("mg_fire")).toBe("poor");
  });

  it("throws when nothing is pending and writes nothing", () => {
    const r = runnerFromInk(FIRE);
    expect(() => r.completeMinigame("good")).toThrow();
    expect(r.getVariable("mg_fire")).toBe("");
    r.next();
    r.completeMinigame("good");
    expect(() => r.completeMinigame("poor")).toThrow();
    expect(r.getVariable("mg_fire")).toBe("good");
  });

  it("next() throws when mg_<id> does not exist, then keeps throwing the same error", () => {
    const r = runnerFromInk("She holds the match. # minigame: fire\n-> END\n");
    let first: unknown;
    try {
      r.next();
    } catch (e) {
      first = e;
    }
    expect(first).toBeInstanceOf(Error);
    let second: unknown;
    try {
      r.next();
    } catch (e) {
      second = e;
    }
    expect(second).toBe(first);
    expect(() => r.completeMinigame("good")).toThrow();
    expect(() => r.choose(0)).toThrow();
  });

  it("next() throws on a malformed tag and on two minigame tags on one line", () => {
    const bad = runnerFromInk('VAR mg_fire = ""\nShe holds it. # minigame:\n-> END\n');
    expect(() => bad.next()).toThrow();
    expect(() => bad.next()).toThrow();
    const two = runnerFromInk(
      'VAR mg_fire = ""\nVAR mg_patch = ""\nShe holds it. # minigame: fire # minigame: patch\n-> END\n',
    );
    expect(() => two.next()).toThrow();
    expect(() => two.completeMinigame("good")).toThrow();
  });

  it("two tagged lines are two stops", () => {
    const r = runnerFromInk(TWICE);
    expect(r.next().minigame).toBe("fire");
    r.completeMinigame("fair");
    const second = r.next();
    expect(second.minigame).toBe("patch");
    expect(lines(second)).toContain("The fire holds.");
    r.completeMinigame("good");
    const last = r.next();
    expect(lines(last)).toContain("The roof holds.");
    expect(last.ended).toBe(true);
  });

  it("poor continues on the poor branch, no dead end", () => {
    const r = runnerFromInk(FIRE);
    r.next();
    r.completeMinigame("poor");
    const step = r.next();
    expect(lines(step)).toContain("The fire sputters.");
    expect(step.choices.length).toBe(1);
  });
});

describe("AC 8: checkpoint and restore", () => {
  function atTrigger(): { r: StoryRunner; checkpoint: string } {
    const r = runnerFromInk(FIRE);
    const step = r.next();
    const checkpoint = step.checkpoint;
    if (checkpoint === undefined) throw new Error("trigger step has no checkpoint");
    return { r, checkpoint };
  }

  it("the trigger step carries a checkpoint string", () => {
    const { checkpoint } = atTrigger();
    expect(typeof checkpoint).toBe("string");
    expect(() => JSON.parse(checkpoint)).not.toThrow();
  });

  it("restore returns an empty-lines trigger step with the same checkpoint", () => {
    const { r, checkpoint } = atTrigger();
    r.completeMinigame("good");
    r.next();
    r.choose(0);
    r.next();
    const step = r.restore(checkpoint, "fire");
    expect(step).toEqual({
      lines: [],
      choices: [],
      ended: false,
      minigame: "fire",
      checkpoint,
    });
  });

  it("restore, then next() throws, then completeMinigame continues after the tag", () => {
    const { r, checkpoint } = atTrigger();
    r.completeMinigame("good");
    r.next();
    r.restore(checkpoint, "fire");
    expect(() => r.next()).toThrow();
    r.completeMinigame("fair");
    const step = r.next();
    expect(lines(step)).toContain("The fire holds.");
    expect(lines(step)).not.toContain("She holds the match.");
  });

  it("works on a fresh runner too (restore after an app restart)", () => {
    const { checkpoint } = atTrigger();
    const fresh = runnerFromInk(FIRE);
    fresh.restore(checkpoint, "fire");
    fresh.completeMinigame("poor");
    expect(lines(fresh.next())).toContain("The fire sputters.");
  });

  it("an invalid checkpoint throws and leaves the runner as it was", () => {
    const { r } = atTrigger();
    expect(() => r.restore("not json", "fire")).toThrow();
    expect(() => r.next()).toThrow(); // still pending
    r.completeMinigame("good");
    expect(lines(r.next())).toContain("The fire roars.");
  });

  it("an id with no mg_<id> variable throws and leaves the runner as it was", () => {
    const { r, checkpoint } = atTrigger();
    expect(() => r.restore(checkpoint, "nope")).toThrow();
    expect(() => r.next()).toThrow(); // still pending
    r.completeMinigame("good");
    expect(r.getVariable("mg_fire")).toBe("good");
  });

  it("a bad id throws and leaves a not-pending runner not pending", () => {
    const r = runnerFromInk(FIRE);
    const cp = JSON.stringify({});
    expect(() => r.restore(cp, "Fire")).toThrow();
    const step = r.next();
    expect(step.minigame).toBe("fire");
  });

  it("no longer has save() and load()", () => {
    const r = runnerFromInk(FIRE) as unknown as Record<string, unknown>;
    expect(r.save).toBeUndefined();
    expect(r.load).toBeUndefined();
  });
});
