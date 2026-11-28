import { describe, expect, it } from "vitest";
import en from "../src/i18n/en.json";
import hu from "../src/i18n/hu.json";

const EN = en as Record<string, string>;
const HU = hu as Record<string, string>;

const TABLE: Record<string, [string, string]> = {
  "mode.pick.title": ["Choose how to play", "Válaszd ki, hogyan játszol"],
  "mode.pick.note": [
    "Both modes have the same story, with every path open. You can change the mode at any time in Settings.",
    "Mindkét módban ugyanaz a történet, és minden út nyitva áll. A módot bármikor átállíthatod a Beállításokban.",
  ],
  "mode.easy.name": ["Easy", "Könnyű"],
  "mode.easy.hint": [
    "Retry each minigame as often as you like. Relaxed timing.",
    "Minden minijátékot újrajátszhatsz, ahányszor csak szeretnéd. Kényelmes időzítés.",
  ],
  "mode.normal.name": ["Normal", "Normál"],
  "mode.normal.hint": [
    "Play each minigame once, as it comes. Standard timing.",
    "Minden minijátékot egyszer játszol, ahogy jön. Szokásos időzítés.",
  ],
  "mode.change.note": [
    "A change applies from the next minigame.",
    "A változás a következő minijátéktól érvényes.",
  ],
  "settings.open": ["Settings", "Beállítások"],
  "settings.title": ["Settings", "Beállítások"],
  "settings.close": ["Close", "Bezárás"],
  "settings.mode.title": ["Game mode", "Játékmód"],
  "settings.newgame.button": ["New game", "Új játék"],
  "settings.newgame.confirm.title": ["Start a new game?", "Új játékot kezdesz?"],
  "settings.newgame.confirm.body": [
    "Your saved game will be deleted, and you will choose a game mode again.",
    "A mentett játékod törlődik, és újra választasz játékmódot.",
  ],
  "settings.newgame.confirm.yes": ["Start a new game", "Új játék indítása"],
  "settings.newgame.confirm.no": ["Keep playing", "Játék folytatása"],
};

const EN_VALUE_WORDS = [
  "more",
  "less",
  "easier",
  "harder",
  "forgiving",
  "challenge",
  "recommended",
  "beginner",
  "best",
  "real",
  "true",
];
const HU_VALUE_WORDS = [
  "könnyebb",
  "nehezebb",
  "engedékenyebb",
  "kihívás",
  "ajánlott",
  "kezdő",
  "igazi",
  "legjobb",
];
const EN_STORY_WORDS = ["story", "band", "result"];
const HU_STORY_WORDS = ["történet", "sáv", "eredmény"];
const EN_GUILT = ["give up", "lose", "progress", "are you sure", "really", "forever"];
const HU_GUILT = ["feladod", "elveszíted", "biztosan", "tényleg", "örökre"];

function hasWord(text: string, word: string): boolean {
  const re = new RegExp("(?<![\\p{L}])" + word + "(?![\\p{L}])", "iu");
  return re.test(text);
}

const words = (s: string): number => s.trim().split(/\s+/u).length;

describe("AC 18 (keys): every string of the table", () => {
  for (const [key, [enText, huText]] of Object.entries(TABLE)) {
    it(key + " is non-empty and exact in en and hu", () => {
      expect(EN[key]).toBe(enText);
      expect(HU[key]).toBe(huText);
    });
  }
});

describe("AC 3: neutral hints", () => {
  for (const [lang, dict, banned, storyWords] of [
    ["en", EN, EN_VALUE_WORDS, EN_STORY_WORDS],
    ["hu", HU, HU_VALUE_WORDS, HU_STORY_WORDS],
  ] as const) {
    const easy = dict["mode.easy.hint"] ?? "";
    const normal = dict["mode.normal.hint"] ?? "";

    it(lang + ": both hints exist", () => {
      expect(easy.length).toBeGreaterThan(0);
      expect(normal.length).toBeGreaterThan(0);
    });

    it(lang + ": same shape, a retry sentence then a two-word timing phrase", () => {
      for (const hint of [easy, normal]) {
        const sentences = hint.split(/(?<=\.)\s+/u);
        expect(sentences).toHaveLength(2);
        expect(sentences[0]?.endsWith(".")).toBe(true);
        expect(sentences[1]?.endsWith(".")).toBe(true);
        expect(words((sentences[1] ?? "").replace(/\.$/u, ""))).toBe(2);
      }
    });

    it(lang + ": word counts within 2 of each other", () => {
      expect(Math.abs(words(easy) - words(normal))).toBeLessThanOrEqual(2);
    });

    it(lang + ": no comparatives or value words", () => {
      for (const hint of [easy, normal]) {
        for (const w of banned) expect(hasWord(hint, w), w + " in: " + hint).toBe(false);
      }
    });

    it(lang + ": no mention of the story, a band or a result", () => {
      for (const hint of [easy, normal]) {
        for (const w of storyWords) expect(hasWord(hint, w), w + " in: " + hint).toBe(false);
      }
    });
  }

  it("the hints are not the mode note (a separate line shows mode.pick.note)", () => {
    expect(EN["mode.pick.note"]).not.toBe(EN["mode.easy.hint"]);
    expect(EN["mode.pick.note"]).toBeTruthy();
    expect(HU["mode.pick.note"]).toBeTruthy();
  });

  it("the pick note names the settings label", () => {
    expect(EN["mode.pick.note"]).toContain(EN["settings.title"]);
    expect(HU["mode.pick.note"]).toContain((HU["settings.title"] ?? "").slice(0, -1));
  });
});

describe("AC 3, 11: the confirmation has no guilt wording", () => {
  const keys = [
    "settings.newgame.confirm.title",
    "settings.newgame.confirm.body",
    "settings.newgame.confirm.yes",
    "settings.newgame.confirm.no",
  ];

  for (const [lang, dict, banned] of [
    ["en", EN, EN_GUILT],
    ["hu", HU, HU_GUILT],
  ] as const) {
    it(lang + ": none of the banned words", () => {
      for (const key of keys) {
        for (const w of banned) {
          expect(hasWord(dict[key] ?? "", w), w + " in " + key).toBe(false);
        }
      }
    });

    it(lang + ": the body is one sentence", () => {
      const body = dict["settings.newgame.confirm.body"] ?? "";
      expect(body.endsWith(".")).toBe(true);
      expect(body.slice(0, -1)).not.toMatch(/[.!?]/u);
    });

    it(lang + ": the two buttons are parallel, neither is empty", () => {
      const yes = dict["settings.newgame.confirm.yes"] ?? "";
      const no = dict["settings.newgame.confirm.no"] ?? "";
      expect(yes.length).toBeGreaterThan(0);
      expect(no.length).toBeGreaterThan(0);
    });
  }
});
