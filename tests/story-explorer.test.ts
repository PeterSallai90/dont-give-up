import { describe, expect, it } from "vitest";
import type { Story } from "inkjs";
import { StoryRunner } from "../src/story/runner";
import { advance } from "../src/story/advance";
import { BANDS } from "../src/story/bands";
import type { SegmentEvent } from "../tools/story-explorer";
import { exploreStories, stateKey } from "../tools/story-explorer";
import { compileSource } from "../tools/ink";

function story(source: string): Story {
  const { story: s, errors } = compileSource(source);
  if (!s) throw new Error(`fixture did not compile: ${errors.join("; ")}`);
  return s;
}

const SMALL = { maxPaths: 300 };

function explore(
  source: string,
  options: Parameters<typeof exploreStories>[1] = {},
): {
  problems: string[];
  stats: ReturnType<typeof exploreStories>["stats"];
  segments: SegmentEvent[];
} {
  const segments: SegmentEvent[] = [];
  const report = exploreStories([{ lang: "en", story: story(source) }], {
    ...SMALL,
    ...options,
    onSegment: (s) => segments.push(s),
  });
  return { problems: report.problems, stats: report.stats, segments };
}

const texts = (s: SegmentEvent): string[] => s.lines.map((l) => l.text);
const trailOf = (s: SegmentEvent): string => s.trail.join(" > ");

const FIRE = `
VAR mg_fire = ""
-> lodge
=== lodge ===
The lodge is cold.
She holds the match. # minigame: fire
{mg_fire == "good": -> great}
{mg_fire == "fair": The fire holds.}
{mg_fire == "poor": The fire sputters.}
-> END
=== great ===
The fire roars.
-> END
`;

const TWICE = `
VAR mg_fire = ""
VAR mg_patch = ""
-> lodge
=== lodge ===
She holds the match. # minigame: fire
{mg_fire == "poor": The fire sputters.}
{mg_fire == "fair": The fire holds.}
{mg_fire == "good": The fire roars.}
She lifts the patch. # minigame: patch
{mg_patch == "good": The roof holds.}
-> END
`;

describe("AC 1: one stop rule for the runner and the explorer", () => {
  it("the explorer and StoryRunner agree on trigger ids and lead-in lines", () => {
    const runner = new StoryRunner(story(TWICE).ToJson() ?? "");
    const played: { id: string; lines: string[] }[] = [];
    for (let i = 0; i < 4; i++) {
      const step = runner.next();
      if (!step.minigame) break;
      played.push({ id: step.minigame, lines: step.lines.map((l) => l.text) });
      runner.completeMinigame("fair");
    }
    const { segments } = explore(TWICE);
    const first = segments.find((s) => s.trail.length === 0);
    const second = segments.find((s) => trailOf(s) === "fire:fair" && s.stop.kind === "trigger");
    expect(played.map((p) => p.id)).toEqual(["fire", "patch"]);
    expect(first?.stop).toEqual({ kind: "trigger", id: "fire" });
    expect(second?.stop).toEqual({ kind: "trigger", id: "patch" });
    expect(first ? texts(first) : []).toEqual(played[0]?.lines);
    expect(second ? texts(second) : []).toEqual(["The fire holds.", "She lifts the patch."]);
  });

  it("forks on every band in BANDS", () => {
    const { segments } = explore(FIRE);
    const forks = segments.filter((s) => s.trail.length === 1).map((s) => s.trail[0]);
    expect(new Set(forks)).toEqual(new Set(BANDS.map((b) => `fire:${b}`)));
  });
});

describe("AC 2: fork before any band text", () => {
  it("the segment that ends at the trigger holds no band text, and each band segment starts with its text", () => {
    const { segments, problems } = explore(FIRE);
    expect(problems).toEqual([]);
    const trigger = segments.find((s) => s.trail.length === 0);
    expect(trigger?.stop).toEqual({ kind: "trigger", id: "fire" });
    expect(trigger ? texts(trigger) : []).toEqual(["The lodge is cold.", "She holds the match."]);
    const first = (band: string): string | undefined =>
      texts(
        segments.find((s) => trailOf(s) === `fire:${band}`) ??
          ({ lines: [] } as unknown as SegmentEvent),
      )[0];
    expect(first("fair")).toBe("The fire holds.");
    expect(first("poor")).toBe("The fire sputters.");
    expect(first("good")).toBe("The fire roars.");
  });

  it("a band-dependent choice right after the tag is not offered in the trigger segment, and its knot is reached", () => {
    const { segments, problems } = explore(`
VAR mg_fire = ""
-> lodge
=== lodge ===
She holds the match. # minigame: fire
* {mg_fire == "good"} [Feed it] -> great
+ [Leave] -> END
=== great ===
The fire roars.
-> END
`);
    const trigger = segments.find((s) => s.trail.length === 0);
    expect(trigger?.stop.kind).toBe("trigger");
    expect(problems).toEqual([]);
  });
});

describe("AC 3: several triggers, malformed tags", () => {
  it("two tagged lines give two forks (nine complete trails)", () => {
    const { segments, problems } = explore(TWICE);
    expect(problems).toEqual([]);
    const ends = new Set(segments.filter((s) => s.stop.kind === "end").map(trailOf));
    expect(ends.size).toBe(9);
    expect(ends.has("fire:good > patch:poor")).toBe(true);
  });

  it("two minigame tags on one line fail and name the language", () => {
    const { problems } = explore(
      'VAR mg_fire = ""\nVAR mg_patch = ""\n-> t\n=== t ===\nHold. # minigame: fire # minigame: patch\n-> END\n',
    );
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((p) => p.startsWith("[en] "))).toBe(true);
  });

  it("a minigame tag with no id fails and names the language", () => {
    const { problems } = explore("-> t\n=== t ===\nHold. # minigame:\n-> END\n");
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]).toMatch(/^\[en\] /);
  });
});

describe("AC 4: every knot behind a band is reached", () => {
  it("a knot reachable only through the good band is reached and nothing is reported", () => {
    const { problems, stats } = explore(FIRE);
    expect(problems).toEqual([]);
    expect(stats[0]?.partial).toBe(false);
    expect(stats[0]?.knotsReached).toBe(stats[0]?.knotsTotal);
  });

  it("a knot that no band and no choice reaches is reported as never reached", () => {
    const { problems } = explore(FIRE + "=== orphan ===\nNobody comes.\n-> END\n");
    expect(problems.some((p) => p.includes("knots never reached") && p.includes("orphan"))).toBe(
      true,
    );
    expect(problems.some((p) => p.includes("all paths explored"))).toBe(true);
  });
});

describe("AC 5: the empty band", () => {
  it('a branch that needs mg_fire == "" after the trigger is dead and reported', () => {
    const { problems } = explore(`
VAR mg_fire = ""
-> lodge
=== lodge ===
She holds the match. # minigame: fire
{mg_fire == "": -> dead}
-> END
=== dead ===
Never.
-> END
`);
    expect(problems.some((p) => p.includes("knots never reached") && p.includes("dead"))).toBe(
      true,
    );
  });

  it('reading mg_fire == "" before any trigger is valid and reaches its knot', () => {
    const { problems } = explore(`
VAR mg_fire = ""
{mg_fire == "": -> slot}
-> lodge
=== slot ===
The slot menu.
-> lodge
=== lodge ===
She holds the match. # minigame: fire
-> END
`);
    expect(problems).toEqual([]);
  });
});

const BAD_TUNNEL = `->->`;

describe("AC 6: bounded, deduplicated report", () => {
  it("a choice menu before a bad band gives exactly one line with the trail", () => {
    const { problems } = explore(`
VAR mg_fire = ""
-> menu
=== menu ===
+ [A] -> lodge
+ [B] -> lodge
+ [C] -> lodge
=== lodge ===
She holds the match. # minigame: fire
{ mg_fire == "poor":
  ${BAD_TUNNEL}
}
-> END
`);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^\[en\] /);
    expect(problems[0]).toContain("(trail: fire:poor)");
  });

  it("distinct trails give distinct problems with the full trail in order", () => {
    const { problems } = explore(`
VAR mg_fire = ""
VAR mg_patch = ""
-> lodge
=== lodge ===
One. # minigame: fire
Two. # minigame: patch
Three. # minigame: fire
->->
`);
    expect(problems).toHaveLength(27);
    expect(problems.some((p) => p.includes("(trail: fire:good > patch:fair > fire:poor)"))).toBe(
      true,
    );
    expect(new Set(problems).size).toBe(27);
  });
});

describe("AC 7: mg_<id> must be a string with initial empty", () => {
  const TAGGED = "-> t\n=== t ===\nHold. # minigame: fire\n-> END\n";
  it("an undeclared mg_fire fails and names the id", () => {
    const { problems } = explore(TAGGED);
    expect(
      problems.some((p) => p.includes('minigame "fire"') && p.includes("is not declared")),
    ).toBe(true);
  });
  it("VAR mg_fire = 0 fails and names the id", () => {
    const { problems } = explore("VAR mg_fire = 0\n" + TAGGED);
    expect(problems.some((p) => p.includes('minigame "fire"') && p.includes('initial ""'))).toBe(
      true,
    );
  });
  it('VAR mg_fire = "poor" fails and names the id', () => {
    const { problems } = explore('VAR mg_fire = "poor"\n' + TAGGED);
    expect(problems.some((p) => p.includes('minigame "fire"') && p.includes('initial ""'))).toBe(
      true,
    );
  });
});

const LOOP = `
VAR mg_fire = ""
-> menu
=== menu ===
+ [Rest] -> menu
+ [Play] -> menu
+ [Leave] -> done
=== done ===
Done.
-> END
`;

describe("AC 8: state pruning and limits", () => {
  it("without pruning the loop hits the path cap and the unreached knot says coverage partial", () => {
    const { problems, stats } = explore(LOOP, { prune: false });
    expect(stats[0]?.partial).toBe("path cap");
    expect(
      problems.some((p) => p.includes("knots never reached") && p.includes("coverage partial")),
    ).toBe(true);
  });

  it("with pruning the loop completes and every knot is reached", () => {
    const { problems, stats } = explore(LOOP, { prune: true });
    expect(problems).toEqual([]);
    expect(stats[0]?.partial).toBe(false);
    expect(stats[0]?.pruned).toBeGreaterThan(0);
    expect(stats[0]?.knotsReached).toBe(stats[0]?.knotsTotal);
  });

  it("the time limit fails with 'too slow' (fake clock)", () => {
    let t = 0;
    const { problems } = explore(LOOP, { timeLimitMs: 500, now: () => (t += 1000) });
    expect(problems.some((p) => p.startsWith("too slow: "))).toBe(true);
  });

  it("a time limit of 0 fails with 'too slow'", () => {
    let t = 0;
    const { problems } = explore(FIRE, { timeLimitMs: 0, now: () => (t += 1) });
    expect(problems.some((p) => p.includes("too slow: "))).toBe(true);
  });

  it("two paths that differ only in a taken once-only choice are both explored", () => {
    const { problems } = explore(`
VAR mg_fire = ""
-> menu
=== menu ===
Menu.
* (forage) [Forage] -> join
+ [Skip] -> join
+ {menu2 and not forage} [Wait] -> hungry
=== join ===
Later.
-> menu2
=== menu2 ===
+ [Back] -> menu
+ [Exit] -> END
=== hungry ===
Hungry.
-> END
`);
    expect(problems).toEqual([]);
  });

  it("one tunnel called with two argument values: both continuations are explored", () => {
    const { problems } = explore(`
VAR mg_fire = ""
-> menu
=== menu ===
+ [A] -> go(1)
+ [B] -> go(2)
=== go(n) ===
-> tun(n) ->
{n == 1: -> one}
-> two
=== tun(m) ===
+ [Go] ->->
=== one ===
One.
-> END
=== two ===
Two.
-> END
`);
    expect(problems).toEqual([]);
  });

  it("a phase 0 shaped story completes inside the default caps with no problems", () => {
    const report = exploreStories([
      {
        lang: "en",
        story: story(`
VAR mg_fire = ""
VAR mg_patch = ""
VAR day = 1
VAR warmth = 3
-> slot
=== slot ===
{day > 4: -> night}
+ [Rest]
  ~ warmth += 1
  ~ day += 1
  -> slot
+ [Play]
  ~ warmth += 1
  ~ day += 1
  -> slot
+ {mg_fire == ""} [Tend the fire] -> fire_beat
+ {mg_patch == ""} [Patch the roof] -> patch_beat
+ [Sleep] -> night
=== fire_beat ===
She holds the match. # minigame: fire
{ mg_fire == "good":
  ~ warmth += 2
}
{ mg_fire == "poor":
  ~ warmth -= 1
}
~ day += 1
-> slot
=== patch_beat ===
She lifts the patch. # minigame: patch
{ mg_patch == "good":
  ~ warmth += 1
}
~ day += 1
-> slot
=== night ===
Night.
-> END
`),
      },
    ]);
    expect(report.problems).toEqual([]);
    expect(report.stats[0]?.partial).toBe(false);
  });
});

describe("stateKey", () => {
  function keyAfter(source: string, choices: number[]): string {
    const s = story(source);
    advance(s);
    for (const c of choices) {
      s.ChooseChoiceIndex(c);
      advance(s);
    }
    return stateKey(s.state.ToJson());
  }

  it("is equal for two passes of the loop menu", () => {
    expect(keyAfter(LOOP, [])).toBe(keyAfter(LOOP, [0]));
    expect(keyAfter(LOOP, [0])).toBe(keyAfter(LOOP, [0, 1]));
  });

  it("differs when a temp (tunnel argument) differs", () => {
    const src =
      "-> menu\n=== menu ===\n+ [A] -> go(1)\n+ [B] -> go(2)\n=== go(n) ===\n-> tun(n) ->\n-> END\n=== tun(m) ===\n+ [Go] ->->\n";
    expect(keyAfter(src, [0])).not.toBe(keyAfter(src, [1]));
  });

  it("differs when a visited container differs", () => {
    const src =
      "-> menu\n=== menu ===\n* [Forage] -> join\n+ [Skip] -> join\n=== join ===\n+ [Ok] -> END\n";
    expect(keyAfter(src, [0])).not.toBe(keyAfter(src, [1]));
  });
});

describe("AC 10: a trigger needs lead-in text", () => {
  it("a trigger on an empty line fails and names the language and the knot", () => {
    const { problems } = explore(`
VAR mg_fire = ""
VAR x = false
-> lodge
=== lodge ===
{x: Hello} # minigame: fire
-> END
`);
    expect(
      problems.some(
        (p) => p.startsWith("[en] ") && p.includes("lodge") && p.includes("no lead-in text"),
      ),
    ).toBe(true);
  });
});

describe("a labelled sticky choice whose count the story reads", () => {
  const LABELLED = `
VAR mg_fire = ""
-> menu
=== menu ===
{menu.rested: -> bonus}
+ (rested) [Rest] -> menu
+ [Leave] -> END
=== bonus ===
Rested.
-> END
`;

  it("stateKey at the menu differs before and after one rest", () => {
    const s = story(LABELLED);
    advance(s);
    const before = stateKey(s.state.ToJson());
    s.ChooseChoiceIndex(0);
    advance(s);
    const after = stateKey(s.state.ToJson());
    expect(after).not.toBe(before);
  });

  it("the explorer reaches the knot behind the read count", () => {
    const { problems } = explore(LABELLED);
    expect(problems).toEqual([]);
  });
});

describe("a labelled sticky choice read in a later knot", () => {
  const LATER = `
VAR mg_fire = ""
-> menu
=== menu ===
+ (rested) [Rest] Resting.
  -> menu
+ [Leave] -> out
=== out ===
{menu.rested: -> bonus}
Plain end.
-> END
=== bonus ===
Bonus end.
-> END
`;

  it("stateKey at the menu differs before and after one rest", () => {
    const s = story(LATER);
    advance(s);
    const before = stateKey(s.state.ToJson());
    s.ChooseChoiceIndex(0);
    advance(s);
    const after = stateKey(s.state.ToJson());
    expect(after).not.toBe(before);
  });

  it("the explorer reaches the bonus knot", () => {
    expect(explore(LATER).problems).toEqual([]);
  });
});
