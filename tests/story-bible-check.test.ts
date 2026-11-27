import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parseBible, readBible } from "../tools/bible";
import { checkStory } from "../tools/story-check";
import { checkTagParity, readTagUses } from "../tools/story-bible-check";

const BIBLE = [
  "## Places and scene values",
  "",
  "| `scene` value | Place | Status |",
  "| --- | --- | --- |",
  "| `cabin` | Lodge | M1 |",
  "| `manor_hall` | Hall | M2, proposed |",
  "",
  "## Story variables",
  "",
  "| Variable | Type |",
  "| --- | --- |",
  "| `warmth` | int |",
  "| `mg_fire` | string |",
  "| `mg_patch` | string |",
  "",
  "## Tags",
  "",
  "| Tag | Values | Status |",
  "| --- | --- | --- |",
  "| `# scene: <id>` | The values in Places and scene values | Supported |",
  "| `# minigame: <id>` | `fire`, `patch` | Supported |",
  "| `# tutorial: <id>` | `slot_costs` | Proposed, not promised |",
  "| `# mood: <id>` | `warm` | Proposed, inert |",
  "",
].join("\n");

const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

function story(en: string, hu: string = en, extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "bible-"));
  dirs.push(dir);
  for (const [lang, text] of [
    ["en", en],
    ["hu", hu],
  ] as const) {
    mkdirSync(join(dir, lang), { recursive: true });
    writeFileSync(join(dir, lang, "main.ink"), text);
    for (const [name, content] of Object.entries(extra))
      writeFileSync(join(dir, lang, name), content);
  }
  return dir;
}

const BASE = (body: string, vars = "VAR warmth = 1"): string =>
  `${vars}\n-> start\n=== start ===\n${body}\n-> END\n`;

function run(dir: string, bible: string | null = BIBLE): string[] {
  return checkStory({ storyDir: dir, bible }).problems.filter(
    (p) => p.includes("bible") || p.includes("tags differ"),
  );
}

describe("AC 1: tag values", () => {
  it("passes when every value is listed", () => {
    const d = story(BASE("Hi. # scene: cabin\nGo. # minigame: fire"));
    expect(run(d)).toEqual([]);
  });
  it("fails an unlisted scene, minigame and tutorial value, naming file, tag and value", () => {
    const d = story(BASE("A. # scene: attic\nB. # minigame: lock\nC. # tutorial: nope"));
    const out = run(d);
    expect(out).toHaveLength(6);
    expect(out[0]).toContain("[en]");
    expect(out.join("\n")).toContain("main.ink:5");
    expect(out.join("\n")).toContain("# scene: attic");
    expect(out.join("\n")).toContain("# minigame: lock");
    expect(out.join("\n")).toContain("# tutorial: nope");
  });
  it("fails in hu alone", () => {
    const en = BASE("A. # scene: cabin");
    const out = run(story(en, BASE("A. # scene: hall")));
    expect(out.some((p) => p.startsWith("[hu]") && p.includes("# scene: hall"))).toBe(true);
  });
});

describe("AC 2: status does not matter", () => {
  it("accepts a proposed scene and a not promised tutorial value", () => {
    const d = story(BASE("A. # scene: manor_hall\nB. # tutorial: slot_costs"));
    expect(run(d)).toEqual([]);
  });
});

describe("AC 3: variables", () => {
  it("fails a VAR, CONST and LIST with no row, naming file and name", () => {
    const d = story(
      BASE("A.", "VAR warmth = 1\nVAR ghost = 0\nCONST limit = 3\nLIST moods = a, b"),
    );
    const out = run(d);
    for (const name of ["ghost", "limit", "moods"]) {
      expect(out.some((p) => p.includes(`"${name}"`) && p.includes("main.ink"))).toBe(true);
    }
  });
  it("covers INCLUDEd files", () => {
    const d = story(BASE("A.", "INCLUDE more.ink\nVAR warmth = 1"), undefined, {
      "more.ink": "VAR hidden = 2\n",
    });
    expect(run(d).some((p) => p.includes("more.ink") && p.includes('"hidden"'))).toBe(true);
  });
  it("mg_<id> needs its own row", () => {
    const d = story(BASE("A.", 'VAR warmth = 1\nVAR mg_fire = ""\nVAR mg_roof = ""'));
    const out = run(d);
    expect(out).toHaveLength(2);
    expect(out.join("\n")).toContain('"mg_roof"');
  });
});

describe("AC 4: the bible must be readable", () => {
  const d = (): string => story(BASE("A."));
  it("fails when the bible file is missing", () => {
    expect(run(d(), null).join("\n")).toContain("is missing");
  });
  for (const heading of ["Tags", "Places and scene values", "Story variables"]) {
    it(`fails and names a missing "${heading}" table`, () => {
      const out = run(d(), BIBLE.replace(`## ${heading}`, `## ${heading} renamed`));
      expect(out.join("\n")).toContain(`table "${heading}" is missing`);
    });
    it(`fails and names a zero-row "${heading}" table`, () => {
      const lines = BIBLE.split("\n");
      const at = lines.indexOf(`## ${heading}`);
      let end = lines.findIndex((l, i) => i > at && l === "");
      end = lines.findIndex((l, i) => i > end + 1 && l === "");
      const cut = [...lines.slice(0, at + 4), ...lines.slice(end)].join("\n");
      expect(run(d(), cut).join("\n")).toContain(`table "${heading}" has no rows`);
    });
  }
});

describe("AC 5: tag parity", () => {
  it("fails when hu drops a minigame patch tag that en has, naming the knot and both lists", () => {
    const en = BASE("Fix it. # minigame: patch");
    const hu = BASE("Javítsd. ");
    const out = run(story(en, hu));
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("[hu]");
    expect(out[0]).toContain("start");
    expect(out[0]).toContain("en has [# minigame: patch], hu has []");
  });
  it("fails on a different order or value", () => {
    const en = BASE("A. # scene: cabin\nB. # minigame: fire");
    const hu = BASE("A. # minigame: fire\nB. # scene: cabin");
    expect(run(story(en, hu))).toHaveLength(1);
  });
  it("reads two tags on one line and choice-line tags as separate tags", () => {
    const files = [
      {
        path: "x.ink",
        text: "=== k ===\nA. # scene: cabin # minigame: fire\n* [Go] # tutorial: slot_costs\n  -> END\n= s\nB. # scene: cabin\n",
      },
    ];
    const uses = readTagUses(files).map((u) => `${u.place} ${u.key}=${u.value}`);
    expect(uses).toEqual([
      "k scene=cabin",
      "k minigame=fire",
      "k tutorial=slot_costs",
      "k.s scene=cabin",
    ]);
    const hu = [
      {
        path: "y.ink",
        text: "=== k ===\nA. # scene: cabin\n* [Go] # tutorial: slot_costs\n -> END\n= s\nB. # scene: cabin\n",
      },
    ];
    const out = checkTagParity({ lang: "en", files }, { lang: "hu", files: hu });
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("k:");
  });
});

describe("AC 6: unchecked tags", () => {
  it("ignores mood, pov and other keys, even with values not in the bible", () => {
    const d = story(BASE("A. # mood: grim\nB. # pov: nobody"), BASE("A. # mood: other\nB."));
    expect(run(d)).toEqual([]);
  });
});

describe("AC 7: the real bible and the real story", () => {
  it("the real bible parses with rows for every checked table", () => {
    const bible = parseBible(readBible());
    expect(bible.problems).toEqual([]);
    expect(bible.tagValues.get("scene")?.has("cabin")).toBe(true);
    expect(bible.tagValues.get("minigame")).toEqual(new Set(["fire", "patch"]));
    expect(bible.variables.has("mg_patch")).toBe(true);
  });
  it("the real story passes", () => {
    const out = checkStory().problems.filter(
      (p) => p.includes("bible") || p.includes("tags differ"),
    );
    expect(out).toEqual([]);
  });
});
