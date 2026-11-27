import { describe, expect, it } from "vitest";
import { braceGroups, readInkFiles, stripComments } from "../tools/ink-source";
import type { InkFile } from "../tools/ink-source";
import { lintStory } from "../tools/story-lint";

const PREFIX = [
  "VAR warmth = 0",
  "VAR hope = 0",
  "-> main",
  "=== forage ===",
  "Berries.",
  "-> main",
  "=== loft ===",
  "Dust.",
  "-> main",
  "=== main ===",
].join("\n");

function lint(body: string, lang = "en"): string[] {
  const files: InkFile[] = [{ path: `story/${lang}/main.ink`, text: `${PREFIX}\n${body}\n` }];
  return lintStory(lang, files);
}

/** 1-based line number of the body's first line. */
const BODY_LINE = PREFIX.split("\n").length + 1;

describe("AC 9: minigame tag form", () => {
  it("fails a minigame tag alone on its own line, with language, file and line", () => {
    const out = lint("She holds the match.\n# minigame: fire\n-> END");
    expect(out).toHaveLength(1);
    expect(out[0]).toContain(`[en] story/en/main.ink:${BODY_LINE + 1}: `);
    expect(out[0]).toContain("minigame tag on its own line");
  });

  it("fails a tag-only line that holds another tag next to the minigame tag", () => {
    const out = lint("She holds.\n# mood: tense # minigame: fire\n-> END");
    expect(out.some((m) => m.includes("minigame tag on its own line"))).toBe(true);
  });

  it("passes another tag alone on its own line", () => {
    expect(lint("She holds.\n# mood: tense\n-> END")).toEqual([]);
  });

  it("passes a tag at the end of a text line", () => {
    expect(lint("She holds the match. # minigame: fire\n-> END")).toEqual([]);
  });

  it("fails a minigame tag on a choice line", () => {
    const out = lint("* [Light it] # minigame: fire\n  -> END");
    expect(out.some((m) => m.includes("minigame tag on a choice line"))).toBe(true);
    const sticky = lint("+ [Light it] # minigame: fire\n  -> END");
    expect(sticky.some((m) => m.includes("minigame tag on a choice line"))).toBe(true);
  });

  it("fails a line that starts with glue", () => {
    const out = lint("She holds.\n<> the match.\n-> END");
    expect(out.some((m) => m.includes("line starts with glue"))).toBe(true);
  });

  it("ignores a tag or a sequence inside comments", () => {
    expect(lint("She holds.\n// # minigame: fire\n/* # minigame: fire\n{a|b} */\n-> END")).toEqual(
      [],
    );
  });

  it("names the language in the message for hu", () => {
    const out = lint("Tartja.\n# minigame: fire\n-> END", "hu");
    expect(out[0]?.startsWith("[hu] story/hu/main.ink:")).toBe(true);
  });

  it("walks INCLUDEd files and reports the right file and line", () => {
    const files = readInkFiles("en", "tests/fixtures/ink-lint");
    expect(files.map((f) => f.path).sort()).toEqual([
      "tests/fixtures/ink-lint/en/main.ink",
      "tests/fixtures/ink-lint/en/part.ink",
    ]);
    const out = lintStory("en", files);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("[en] tests/fixtures/ink-lint/en/part.ink:3: ");
  });
});

describe("AC 11: no visit-count reads beyond visited-or-not, no turns, no randomness", () => {
  const bad = (body: string): void => {
    const out = lint(body);
    expect(out.length, body).toBeGreaterThan(0);
    expect(out[0], body).toMatch(/^\[en\] story\/en\/main\.ink:\d+: /);
  };
  const good = (body: string): void => expect(lint(body), body).toEqual([]);

  it("passes the visited-or-not forms", () => {
    good("{forage: Berries.}\n-> END");
    good("{not forage: Berries.}\n-> END");
    good("{!forage: Berries.}\n-> END");
    good("{forage > 0: Berries.}\n-> END");
    good("{forage == 0: Berries.}\n-> END");
    good("{forage and not loft: Both.}\n-> END");
    good("{forage or loft: One.}\n-> END");
    good("{(forage) && (loft): Both.}\n-> END");
  });

  it("passes the forms the story uses", () => {
    good("{ warmth > 2: Warm. | Cold. }\n-> END");
    good("{\n  - warmth > 2:\n    Warm.\n  - else:\n    Cold.\n}\n-> END");
    good("{ warmth:\n  - 1: One.\n  - 2: Two.\n}\n-> END");
    good("* [Once] -> END\n+ [Sticky] -> END");
    good("{warmth}\n-> END");
    good("* {forage} [Again] -> END");
    good("Back to forage -> forage");
  });

  it("fails a count read beyond visited-or-not", () => {
    bad("{forage > 1: Twice.}\n-> END");
    bad("{forage == 2: Twice.}\n-> END");
    bad("{forage >= 1: Once.}\n-> END");
    bad("{forage + 1 > 1: Once.}\n-> END");
    bad("* {forage > 1} [Again] -> END");
  });

  it("fails a printed visit count", () => {
    const out = lint("{forage}\n-> END");
    expect(out.some((m) => m.includes("prints a visit count"))).toBe(true);
  });

  it("fails a counted name on a ~ line", () => {
    bad("~ warmth = forage + 1\n-> END");
  });

  it("fails TURNS, TURNS_SINCE, RANDOM and SEED_RANDOM", () => {
    bad("{TURNS() > 3: Late.}\n-> END");
    bad("{TURNS_SINCE(-> forage) > 3: Late.}\n-> END");
    bad("~ warmth = RANDOM(1, 3)\n-> END");
    bad("~ SEED_RANDOM(4)\n-> END");
  });

  it("fails sequences, cycles, once and shuffle", () => {
    bad("{a|b}\n-> END");
    bad("{!a|b}\n-> END");
    bad("{&a|b}\n-> END");
    bad("{~a|b}\n-> END");
    bad("{stopping:\n  - one\n  - two\n}\n-> END");
    bad("{cycle:\n  - one\n  - two\n}\n-> END");
    bad("{once:\n  - one\n  - two\n}\n-> END");
    bad("{shuffle:\n  - one\n  - two\n}\n-> END");
    bad("{shuffle once:\n  - one\n  - two\n}\n-> END");
    bad("{shuffle stopping:\n  - one\n  - two\n}\n-> END");
    bad("{ warmth > 2: {a|b} | Cold. }\n-> END");
  });

  it("ignores a forbidden form inside a comment", () => {
    good("// {forage > 1: x} TURNS()\n/* {a|b} RANDOM(1,2) */\n-> END");
  });

  it("reports the line of the offending form", () => {
    const out = lint("Fine.\nStill fine.\n{forage > 1: Twice.}\n-> END");
    expect(out[0]).toContain(`:${BODY_LINE + 2}: `);
  });
});

describe("ink-source helpers", () => {
  it("stripComments keeps line count and blanks comments", () => {
    const text = "a // b\n/* c\nd */ e\nf";
    const out = stripComments(text);
    expect(out.split("\n")).toHaveLength(4);
    expect(out).not.toContain("b");
    expect(out).not.toContain("c");
    expect(out).toContain("e");
  });

  it("braceGroups finds nested groups", () => {
    expect(braceGroups("{a: {b|c} | d}").length).toBe(2);
  });
});

describe("the real story lints clean", () => {
  for (const lang of ["en", "hu"]) {
    it(`${lang}`, () => {
      expect(lintStory(lang, readInkFiles(lang))).toEqual([]);
    });
  }
});
