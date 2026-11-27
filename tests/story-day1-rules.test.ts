import { describe, expect, it } from "vitest";
import { compileLanguage, containerNames, variableNames } from "../tools/ink";
import { lineKind, readInkFiles, splitTags, stripComments } from "../tools/ink-source";
import { checkStory } from "../tools/story-check";
import { MAX_PATHS } from "../tools/story-explorer";
import { lintStory } from "../tools/story-lint";
import { runnerFromInk } from "./helpers/ink-fixture";

const LANGS = ["en", "hu"] as const;

const sourceOf = (lang: string): string =>
  readInkFiles(lang)
    .map((f) => f.text)
    .join("\n");
const linesOf = (lang: string): string[] => stripComments(sourceOf(lang)).split("\n");

/** The ink text of one knot or function, header excluded, up to the next "==" header. */
function sectionOf(source: string, header: RegExp): string | null {
  const lines = stripComments(source).split("\n");
  const start = lines.findIndex((l) => header.test(l.trim()));
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && /^==/.test(l.trim()));
  return lines.slice(start, end < 0 ? undefined : end).join("\n");
}

const CHANGE = /^===\s*function\s+change\s*\(\s*ref\s+value\s*,\s*amount\s*,\s*top\s*\)\s*===?/;

// Bible tops (docs/narrative/story-bible.md "Story variables").
const TOPS: Record<string, number> = {
  warmth: 10,
  food: 10,
  hope: 10,
  trust: 10,
  dog_care: 10,
  memory: 5,
  cabin_days: 4,
};

/** Direct writes to a numeric VAR or to mg_* outside the body of change(). */
export function findDirectWrites(source: string): string[] {
  const lines = stripComments(source).split("\n");
  const numeric = new Set<string>();
  for (const l of lines) {
    const m = l.trim().match(/^VAR\s+(\w+)\s*=\s*-?\d+\s*$/);
    if (m) numeric.add(m[1] as string);
  }
  const out: string[] = [];
  let inChange = false;
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (/^==/.test(t)) inChange = CHANGE.test(t);
    if (inChange) return;
    const m = t.match(/^~\s*(?:temp\s+)?(\w+)\s*(\+\+|--|\+=|-=|=(?!=))/);
    if (m && (numeric.has(m[1] as string) || (m[1] as string).startsWith("mg_")))
      out.push(`line ${i + 1}: ${t}`);
  });
  return out;
}

describe("AC 9: change() clamps (the shipped function, cut out of both story files)", () => {
  for (const lang of LANGS) {
    describe(lang, () => {
      const body = sectionOf(sourceOf(lang), CHANGE);

      it("is present in story/${lang}/main.ink".replace("${lang}", lang), () => {
        expect(body).not.toBeNull();
      });

      for (const top of [10, 5, 4]) {
        it(`clamps to 0 and ${top}`, () => {
          expect(body).not.toBeNull();
          const run = (v: number, amount: number): number => {
            const runner = runnerFromInk(
              `VAR a = 0\nVAR b = 0\nVAR t = 0\n~ change(a, b, t)\n-> END\n${body}`,
            );
            runner.setVariable("a", v);
            runner.setVariable("b", amount);
            runner.setVariable("t", top);
            runner.next();
            return runner.getVariable("a") as number;
          };
          expect(run(0, -1)).toBe(0);
          expect(run(0, -5)).toBe(0);
          expect(run(0, 0)).toBe(0);
          expect(run(top, 1)).toBe(top);
          expect(run(top, 0)).toBe(top);
          expect(run(top - 1, 5)).toBe(top);
          expect(run(0, 100)).toBe(top);
          expect(run(1, -1)).toBe(0);
          expect(run(2, 1)).toBe(3);
          expect(run(top, -1)).toBe(top - 1);
        });
      }
    });
  }
});

describe("AC 9: no direct numeric write outside change()", () => {
  it("the scanner finds ~ x = ..., +=, -=, ++ and mg_ writes (self-test)", () => {
    const bad =
      'VAR warmth = 3\nVAR mg_fire = ""\n-> k\n=== k ===\n~ warmth = 4\n~ warmth += 1\n~ warmth -= 1\n~ warmth++\n~ mg_fire = "good"\n-> END\n';
    expect(findDirectWrites(bad)).toHaveLength(5);
    const good =
      "VAR warmth = 3\n=== function change(ref value, amount, top) ===\n~ value = MAX(0, MIN(top, value + amount))\n=== k ===\n~ change(warmth, 1, 10)\n{warmth == 3: x}\n";
    expect(findDirectWrites(good)).toEqual([]);
  });

  for (const lang of LANGS) {
    it(`story/${lang} has no direct write, and every change() call uses the bible top`, () => {
      const source = sourceOf(lang);
      expect(findDirectWrites(source)).toEqual([]);
      const text = stripComments(source)
        .split("\n")
        .filter((l) => !l.trim().startsWith("=="))
        .join("\n");
      const calls = [...text.matchAll(/\bchange\(([^()]*)\)/g)].map((m) =>
        (m[1] as string).split(",").map((s) => s.trim()),
      );
      expect(calls.length).toBeGreaterThan(8);
      const bad = calls.filter(
        ([v, a, top]) =>
          !(v !== undefined && v in TOPS && /^-?\d+$/.test(a ?? "") && Number(top) === TOPS[v]),
      );
      expect(bad).toEqual([]);
    });

    it(`story/${lang} writes the dog as change(dog_care, 4, 10) and the other strings and bools directly`, () => {
      const text = stripComments(sourceOf(lang));
      expect(text).toMatch(/change\(\s*dog_care\s*,\s*4\s*,\s*10\s*\)/);
      expect(text).toMatch(/=== function food_cost\(\s*\) ===?/);
    });
  }
});

describe("AC 8: the morning knot in the source", () => {
  for (const lang of LANGS) {
    it(`story/${lang}: one text line, no variable write, no tag, then END`, () => {
      const section = sectionOf(sourceOf(lang), /^===\s*morning\b/);
      expect(section).not.toBeNull();
      const body = (section as string)
        .split("\n")
        .slice(1)
        .filter((l) => l.trim() !== "");
      expect(body).toHaveLength(2);
      expect(lineKind(body[0] as string)).toBe("text");
      expect((body[0] as string).includes("#")).toBe(false);
      expect((body[0] as string).includes("<>")).toBe(false);
      expect((body[1] as string).trim()).toBe("-> END");
    });
  }
});

describe("AC 11: tags in the source", () => {
  for (const lang of LANGS) {
    it(`story/${lang}: only scene, minigame, tutorial, cutscene and pov, with lowercase id values`, () => {
      const tags = linesOf(lang).flatMap((l) => splitTags(l).tags);
      expect(tags.length).toBeGreaterThan(10);
      expect(
        tags.filter((t) => !/^(scene|minigame|tutorial|cutscene|pov): [a-z_]+$/.test(t)),
      ).toEqual([]);
    });
  }
});

describe("AC 15b and AC 4: tutorial and minigame tag lines in the source", () => {
  for (const lang of LANGS) {
    it(`story/${lang}: three tutorial tags, once each, on plain text lines outside choices, never with a minigame tag`, () => {
      const tutorial: string[] = [];
      for (const raw of linesOf(lang)) {
        const { content, tags } = splitTags(raw);
        const tut = tags.filter((t) => t.startsWith("tutorial:"));
        if (tut.length === 0) continue;
        tutorial.push(...tut);
        expect(lineKind(raw)).toBe("text");
        expect(content.trim()).not.toBe("");
        expect(content.includes("<>")).toBe(false);
        expect(tags.some((t) => t.startsWith("minigame:"))).toBe(false);
      }
      expect(tutorial.sort()).toEqual([
        "tutorial: band_result",
        "tutorial: night_cost",
        "tutorial: slot_costs",
      ]);
    });

    it(`story/${lang}: both minigame tags end a plain text line with no glue and no braces`, () => {
      const ids: string[] = [];
      for (const raw of linesOf(lang)) {
        const { content, tags } = splitTags(raw);
        const mg = tags.filter((t) => t.startsWith("minigame:"));
        if (mg.length === 0) continue;
        ids.push(...mg);
        expect(lineKind(raw)).toBe("text");
        expect(content.trim()).not.toBe("");
        expect(content.includes("<>")).toBe(false);
        expect(content.includes("{")).toBe(false);
      }
      expect(ids.sort()).toEqual(["minigame: fire", "minigame: patch"]);
    });

    it(`story/${lang}: files are LF only`, () => {
      expect(sourceOf(lang).includes("\r")).toBe(false);
    });
  }
});

describe("AC 12: structure of the real story", () => {
  const PART_A = [
    "cart",
    "cart.explore",
    "cart.stay",
    "change",
    "day",
    "day.first",
    "dog_chance",
    "dog_chance.refuse",
    "dog_chance.share",
    "food_cost",
    "intro",
    "lodge",
    "morning",
    "night",
    "night.rose_hips",
    "slot",
    "slot.band_hint",
    "slot.costs_hint",
    "slot.fire",
    "slot.fire_band",
    "slot.forage",
    "slot.loft",
    "slot.menu",
    "slot.patch",
    "slot.patch_band",
    "slot.rest_play",
  ];
  const VARS = [
    "cabin_days",
    "camp",
    "dog",
    "dog_care",
    "food",
    "hope",
    "memory",
    "mg_fire",
    "mg_patch",
    "trunk",
    "trust",
    "warmth",
  ];

  for (const lang of LANGS) {
    it(`story/${lang} has exactly the part a knots and stitches and the twelve variables`, () => {
      const { story, errors } = compileLanguage(lang);
      expect(errors).toEqual([]);
      expect(containerNames(story as NonNullable<typeof story>)).toEqual(PART_A);
      expect(variableNames(story as NonNullable<typeof story>)).toEqual(VARS);
    });
  }
});

describe("AC 13: the explorer limits on the real day 1", () => {
  it("completes inside the default caps with full coverage and no problems", () => {
    const report = checkStory();
    expect(report.problems).toEqual([]);
    for (const s of report.stats) {
      expect(s.partial).toBe(false);
      expect(s.knotsReached).toBe(s.knotsTotal);
      expect(s.segments).toBeLessThanOrEqual(MAX_PATHS);
    }
  }, 60_000);
});

describe("AC 16: writing rules (the #22 lint)", () => {
  for (const lang of LANGS) {
    it(`story/${lang} passes the lint: visit counts as visited or not, no sequences, shuffles, TURNS or randomness`, () => {
      expect(lintStory(lang, readInkFiles(lang))).toEqual([]);
    });
  }
});
