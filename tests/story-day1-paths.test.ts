import { beforeAll, describe, expect, it } from "vitest";
import type { StoryStep } from "../src/story/runner";
import {
  allPaths,
  classify,
  deltas,
  follow,
  normalize,
  optionKinds,
  pathEvents,
  play,
  tagsOf,
  texts,
  VAR_NAMES,
  type Path,
  type Vars,
} from "./helpers/story-day1";

const LANGS = ["en", "hu"] as const;
type Lang = (typeof LANGS)[number];

const memo = new Map<string, Path[]>();
function pathsOf(lang: string): Path[] {
  let hit = memo.get(lang);
  if (!hit) {
    hit = allPaths(lang);
    memo.set(lang, hit);
  }
  return hit;
}

// Lines the bible gives verbatim (EN and HU) or the BA decisions on #13 name; substrings are used
// where a line is part of a longer one.
const TEXT = {
  en: {
    morning: "Morning comes softly to the lodge. Outside, the snow lies blue and still.",
    evening: "Evening comes to the lodge.",
    costs: "Mira rolls up her sleeves. Where to begin?",
    later: "Mira looks around. What next?",
    brush: "Mira brushes off her hands.",
    barley: "thin barley",
    rose: "Rose hips for supper",
    roof: "roof hole whistles",
    stove: "stove stays cold",
    nightLow: "one heap under every coat",
    nightMid: "The lodge creaks in the frost",
    nightHigh: "kicks off his blanket",
    kidsQuiet: "eat without a word",
    kidsChat: "counting every spider",
    dogOurs: "Patch sleeps across the doorway",
    dogNone: "sighs in his sleep",
    shareOption: "Give him your crust, Dani.",
    refuseOption: "Keep your crust, Dani. We need our bread tonight.",
  },
  hu: {
    morning: "Csendesen virrad a vadászlakban. Odakint kéken, mozdulatlanul fekszik a hó.",
    evening: "Beesteledik a vadászlakban.",
    costs: "Mira feltűri az ingujját. Hol kezdje?",
    later: "Mira körülnéz. Mi legyen a következő?",
    brush: "Mira leporolja a kezét.",
    barley: "híg árpakása",
    rose: "Csipkebogyó vacsorára",
    roof: "A lyuk a tetőn egész éjjel fütyül",
    stove: "A kályha hideg marad",
    nightLow: "Egy kupacban alszanak",
    nightMid: "A vadászlak recseg a fagyban",
    nightHigh: "lerúgja a takarót",
    kidsQuiet: "szó nélkül esznek",
    kidsChat: "megszámolom az összes pókot",
    dogOurs: "Foltos keresztben alszik az ajtó előtt",
    dogNone: "nagyot sóhajt álmában",
    shareOption: "Add oda neki a kenyérhéjadat, Dani.",
    refuseOption: "Tartsd meg a kenyérhéjadat, Dani. Ma este nekünk is kell a kenyér.",
  },
} as const;

const STOVE_BURNING = {
  en: /stove (ticks|crackles|burns|burning|glows|purrs|catches|is warm)/i,
  hu: /kályha (pattog|ég|ropog|izzik|dorombol|lángra kap|meleg)/i,
};

const START: Vars = {
  warmth: 3,
  food: 1,
  hope: 2,
  trust: 5,
  memory: 0,
  camp: "",
  trunk: false,
  cabin_days: 0,
  dog: "none",
  dog_care: 0,
  mg_fire: "",
  mg_patch: "",
};

const BAND_DELTAS: Record<string, Record<string, Record<string, number>>> = {
  fire: { good: { warmth: 3, hope: 1 }, fair: { warmth: 2, trust: 1 }, poor: { hope: 1 } },
  patch: { good: { warmth: 2, hope: 1 }, fair: { warmth: 1, trust: 1 }, poor: { hope: 1 } },
};

const PICKS = ["fire", "patch", "forage", "loft", "rest_play"];

interface Expected {
  vars: Record<string, unknown>;
  mealAtZero: boolean;
  rose: boolean;
}

/** The bible's day 1 rules, written out once: events are the picks and bands of one path. */
function expected(events: string[]): Expected {
  const v: Record<string, number | string | boolean> = {
    ...(START as Record<string, number | string | boolean>),
  };
  const num = (k: string): number => v[k] as number;
  const change = (k: string, amount: number, top: number): void => {
    v[k] = Math.max(0, Math.min(top, num(k) + amount));
  };
  const foodCost = (): boolean => {
    if (num("food") === 0) {
      change("hope", -1, 10);
      return true;
    }
    change("food", -1, 10);
    return false;
  };
  let forage = false;
  for (let i = 0; i < events.length; i++) {
    const e = events[i] as string;
    if (e === "stay") {
      Object.assign(v, { camp: "cart", trunk: true });
      change("food", 2, 10);
      change("memory", 1, 5);
      change("warmth", -1, 10);
      change("hope", -1, 10);
    } else if (e === "explore") {
      v.camp = "wood";
      change("trust", 1, 10);
      change("hope", 2, 10);
    } else if (e === "fire" || e === "patch") {
      i++;
      const band = events[i] as string;
      v[`mg_${e}`] = band;
      for (const [k, a] of Object.entries(BAND_DELTAS[e]?.[band] ?? {})) change(k, a, 10);
    } else if (e === "forage") {
      forage = true;
      change("food", 2, 10);
    } else if (e === "loft") {
      change("memory", 1, 5);
      change("trust", 1, 10);
    } else if (e === "rest_play") {
      change("hope", 2, 10);
    } else if (e === "share") {
      foodCost();
      v.dog = "ours";
      change("dog_care", 4, 10);
    } else if (e === "refuse") {
      change("hope", -1, 10);
    }
  }
  const mealAtZero = foodCost();
  if (v.mg_patch === "") change("warmth", -1, 10);
  if (v.mg_fire === "") change("warmth", -1, 10);
  change("cabin_days", 1, 4);
  return { vars: v, mealAtZero, rose: forage && v.mg_patch === "" };
}

/** Runs a check on every path and returns the problems, so a failure names the paths. */
function problemsOn(paths: Path[], check: (p: Path, events: string[]) => string[]): string[] {
  return paths.flatMap((p) => check(p, pathEvents(p)).map((m) => `[${p.key}] ${m}`));
}

const last = <T>(xs: T[]): T => xs[xs.length - 1] as T;
const finalStep = (p: Path): StoryStep => last(p.steps);
const finalVars = (p: Path): Vars => last(p.vars);
const tagCount = (p: Path, tag: string): number =>
  p.steps.flatMap(tagsOf).filter((t) => t === tag).length;

for (const lang of LANGS) {
  const T = TEXT[lang as Lang];

  describe(`day 1 paths (${lang})`, () => {
    let paths: Path[] = [];
    beforeAll(() => {
      paths = pathsOf(lang);
    }, 120_000);

    it("AC 1: the intro shows the cutscene tag then the fallback narration, and P0-1 starts from the start values", () => {
      const first = (paths[0] as Path).steps[0] as StoryStep;
      const tags = tagsOf(first);
      expect(tags).toContain("scene: wood_road");
      expect(tags).toContain("cutscene: intro_crash");
      expect(tags).toContain("scene: cart_camp");
      const cut = first.lines.findIndex((l) => l.tags.includes("cutscene: intro_crash"));
      expect(cut).toBeGreaterThanOrEqual(0);
      expect(first.lines.length).toBeGreaterThanOrEqual(5);
      expect(first.lines.slice(cut + 1).some((l) => l.text !== "")).toBe(true);
      expect(first.choices).toHaveLength(2);
      expect((paths[0] as Path).vars[0]).toEqual(START);
    });

    it("AC 2: Stay writes camp cart, trunk true, food 3, memory 1, warmth 2, hope 1 and offers 2 slots", () => {
      const trail = follow(lang, ["stay"]);
      const p = play(lang, trail);
      const v = last(p.vars);
      expect(v).toEqual({
        ...START,
        camp: "cart",
        trunk: true,
        food: 3,
        memory: 1,
        warmth: 2,
        hope: 1,
      });
      expect(tagsOf(last(p.steps))).toContain("scene: cabin");
      const stay = paths.filter((x) => pathEvents(x)[0] === "stay");
      expect(stay.length).toBe(108);
      for (const x of stay) {
        const picks = pathEvents(x).filter((e) => PICKS.includes(e));
        expect(picks).toHaveLength(2);
        expect(picks.some((e) => e === "fire" || e === "patch")).toBe(true);
      }
    });

    it("AC 2: Explore writes trust 6, hope 4, trunk false and offers 1 slot that is fire or patch", () => {
      const trail = follow(lang, ["explore"]);
      const p = play(lang, trail);
      expect(last(p.vars)).toEqual({ ...START, camp: "wood", trust: 6, hope: 4 });
      expect(tagsOf(last(p.steps))).toContain("scene: cabin");
      expect(optionKinds(lang, trail).sort()).toEqual(["fire", "patch"]);
      const explore = paths.filter((x) => pathEvents(x)[0] === "explore");
      expect(explore.length).toBe(12);
      for (const x of explore) {
        const picks = pathEvents(x).filter((e) => PICKS.includes(e));
        expect(picks).toHaveLength(1);
        expect(["fire", "patch"]).toContain(picks[0]);
      }
    });

    it("AC 3: the first Stay menu offers fire, patch, forage, loft and rest and play, and each writes exactly its bible variables", () => {
      const kinds = optionKinds(lang, follow(lang, ["stay"]));
      expect([...kinds].sort()).toEqual(["fire", "forage", "loft", "patch", "rest_play"]);
      expect(paths.flatMap((p) => pathEvents(p)).filter((e) => e.startsWith("unknown"))).toEqual(
        [],
      );
    });

    it("AC 3b: after a first pick that is neither fire nor patch the second menu offers only fire and patch", () => {
      for (const first of ["forage", "loft", "rest_play"] as const) {
        const kinds = optionKinds(lang, follow(lang, ["stay", first]));
        expect([...kinds].sort()).toEqual(["fire", "patch"]);
      }
    });

    it("AC 3b: after fire the second menu has no fire and has patch; after patch it has no patch and has fire", () => {
      for (const band of ["poor", "fair", "good"] as const) {
        const afterFire = optionKinds(lang, follow(lang, ["stay", "fire", band]));
        expect([...afterFire].sort()).toEqual(["forage", "loft", "patch", "rest_play"]);
        const afterPatch = optionKinds(lang, follow(lang, ["stay", "patch", band]));
        expect([...afterPatch].sort()).toEqual(["fire", "forage", "loft", "rest_play"]);
      }
    });

    it("AC 3b: after the second pick the day ends with no third menu (the dog chance follows)", () => {
      for (const plan of [
        ["stay", "forage", "fire", "good"],
        ["stay", "fire", "good", "patch", "poor"],
        ["stay", "loft", "patch", "fair"],
        ["stay", "fire", "fair", "rest_play"],
        ["stay", "patch", "good", "forage"],
      ] as const) {
        expect([...optionKinds(lang, follow(lang, [...plan]))].sort()).toEqual(["refuse", "share"]);
      }
    });

    it("AC 3b: a Stay player who picks forage then fire ends the day with the patch undone", () => {
      const p = play(lang, follow(lang, ["stay", "forage", "fire", "good", "share"]));
      const v = last(p.vars);
      expect(v.mg_fire).toBe("good");
      expect(v.mg_patch).toBe("");
      expect(v.warmth).toBe(4);
    });

    it("AC 3b: every path has exactly the picks of its camp, and an Explore day has exactly one menu", () => {
      const problems = problemsOn(paths, (p, events) => {
        const picks = events.filter((e) => PICKS.includes(e));
        const menus = p.steps.filter((s) => s.choices.length > 0 && s.choices.length !== 2).length;
        const want = events[0] === "stay" ? 2 : 1;
        return picks.length === want
          ? []
          : [`${picks.length} picks, want ${want} (menus ${menus})`];
      });
      expect(problems).toEqual([]);
    });

    it("AC 4: the minigame tag ends the last lead-in line, is the only one in the step, and the lead-in writes nothing", () => {
      const problems = problemsOn(paths, (p) => {
        const out: string[] = [];
        p.steps.forEach((step, i) => {
          if (!step.minigame) return;
          const tag = `minigame: ${step.minigame}`;
          const lastLine = last(step.lines);
          if (!lastLine || !lastLine.tags.includes(tag))
            out.push(`step ${i}: last line lacks ${tag}`);
          if (tagsOf(step).filter((t) => t.startsWith("minigame")).length !== 1)
            out.push(`step ${i}: not exactly one minigame tag`);
          if (!lastLine || lastLine.text.trim() === "")
            out.push(`step ${i}: tagged line has no text`);
          if (JSON.stringify(p.vars[i]) !== JSON.stringify(p.vars[i - 1]))
            out.push(`step ${i}: the lead-in wrote a variable`);
          if (!step.checkpoint) out.push(`step ${i}: no checkpoint`);
        });
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 5: each band writes the lodge band values and the story continues with text", () => {
      const problems = problemsOn(paths, (p) => {
        const out: string[] = [];
        p.steps.forEach((step, i) => {
          if (!step.minigame) return;
          const move = p.trail[i];
          const band = move && "band" in move ? move.band : "";
          const got = deltas(p.vars[i] as Vars, p.vars[i + 1] as Vars);
          const want = BAND_DELTAS[step.minigame]?.[band];
          const sorted = (o: Record<string, unknown>): string =>
            JSON.stringify(Object.entries(o).sort());
          if (sorted(got) !== sorted(want ?? {}))
            out.push(
              `${step.minigame} ${band}: wrote ${JSON.stringify(got)}, want ${JSON.stringify(want)}`,
            );
          if (p.vars[i + 1]?.[`mg_${step.minigame}` as keyof Vars] !== band)
            out.push("band not stored");
          if (texts(p.steps[i + 1] as StoryStep).every((t) => t === ""))
            out.push(`${step.minigame} ${band}: no text after the band`);
        });
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 6: the dog chance has the two reworded options; a writes dog ours and dog_care 4, b keeps dog none and costs hope", () => {
      const stayTrail = follow(lang, ["stay", "forage", "fire", "good"]);
      const menu = play(lang, stayTrail);
      expect(last(menu.steps).choices.map((c) => normalize(c.text))).toEqual([
        normalize(T.shareOption),
        normalize(T.refuseOption),
      ]);
      const before = last(menu.vars);
      const share = play(lang, [...stayTrail, { choose: 0 }]);
      const refuse = play(lang, [...stayTrail, { choose: 1 }]);
      expect(last(share.vars)).toMatchObject({
        dog: "ours",
        dog_care: 4,
        food: (before.food as number) - 2,
      });
      expect(last(refuse.vars)).toMatchObject({
        dog: "none",
        dog_care: 0,
        food: (before.food as number) - 1,
      });
      expect(last(refuse.vars).hope).toBe((before.hope as number) - 1);
      expect(last(share.steps).ended).toBe(true);
      expect(last(refuse.steps).ended).toBe(true);
    });

    it("AC 7: on every path the final variables equal the bible rules (meal, undone tasks, cabin_days 1)", () => {
      const problems = problemsOn(paths, (p, events) => {
        const want = expected(events).vars;
        const got = finalVars(p);
        return VAR_NAMES.filter((k) => got[k] !== want[k]).map(
          (k) => `${k}: got ${String(got[k])}, want ${String(want[k])}`,
        );
      });
      expect(problems).toEqual([]);
    });

    it("AC 7: night lines follow the rules (barley at food 0, undone-task lines, night line by warmth, children and dog lines)", () => {
      const problems = problemsOn(paths, (p, events) => {
        const exp = expected(events);
        const v = finalVars(p);
        const lines = texts(finalStep(p));
        const all = lines.join("\n");
        const out: string[] = [];
        const has = (s: string): boolean => all.includes(s);
        const must = (cond: boolean, s: string, why: string): void => {
          if (has(s) !== cond) out.push(`${why}: "${s}" ${cond ? "missing" : "present"}`);
        };
        must(exp.mealAtZero, T.barley, "barley");
        must(v.mg_patch === "", T.roof, "patch undone");
        must(v.mg_fire === "", T.stove, "fire undone");
        if (v.mg_fire === "" && STOVE_BURNING[lang as Lang].test(all))
          out.push("fire undone but a line says the stove is burning");
        must(exp.rose, T.rose, "rose hips");
        const w = v.warmth as number;
        must(w <= 2, T.nightLow, "night line low");
        must(w >= 3 && w <= 5, T.nightMid, "night line mid");
        must(w >= 6, T.nightHigh, "night line high");
        must((v.hope as number) <= 2, T.kidsQuiet, "children quiet");
        must((v.hope as number) >= 3, T.kidsChat, "children chat");
        must(v.dog === "ours", T.dogOurs, "dog ours");
        must(v.dog !== "ours", T.dogNone, "dog none");
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 8: every path ends with the one closing line, no choice, no tag, right after the night line", () => {
      const problems = problemsOn(paths, (p) => {
        const step = finalStep(p);
        const out: string[] = [];
        if (!step.ended) out.push("last step not ended");
        if (step.choices.length > 0) out.push("choices at the end");
        const lastLine = last(step.lines);
        if (!lastLine || lastLine.text !== T.morning) out.push(`last line is "${lastLine?.text}"`);
        if (lastLine && lastLine.tags.length > 0) out.push("closing line has tags");
        const w = finalVars(p).warmth as number;
        const key = w <= 2 ? T.nightLow : w <= 5 ? T.nightMid : T.nightHigh;
        const before = step.lines[step.lines.length - 2];
        if (!before || !before.text.includes(key))
          out.push("the night line is not right before the closing line");
        if (step.lines.filter((l) => l.text === T.morning).length !== 1)
          out.push("closing line not exactly once");
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 10: the worst path (Explore, one task, dog a, barley night) reaches the first morning", () => {
      for (const task of ["fire", "patch"] as const) {
        const p = play(lang, follow(lang, ["explore", task, "poor", "share"]));
        const step = last(p.steps);
        expect(step.ended).toBe(true);
        expect(last(step.lines).text).toBe(T.morning);
        const v = last(p.vars);
        expect(v.food).toBe(0);
        expect(texts(step).join("\n")).toContain(T.barley);
        expect(v.cabin_days).toBe(1);
      }
    });

    it("AC 10: no path ends early: every path is complete and ends at the morning", () => {
      expect(paths.length).toBe(120);
      expect(
        problemsOn(paths, (p) =>
          last(texts(finalStep(p))) === T.morning ? [] : ["does not end at the morning"],
        ),
      ).toEqual([]);
    });

    it("AC 11: tags use only scene, minigame, tutorial, cutscene and pov with lowercase id values", () => {
      const bad = paths
        .flatMap((p) => p.steps.flatMap(tagsOf))
        .filter((t) => !/^(scene|minigame|tutorial|cutscene|pov): [a-z_]+$/.test(t));
      expect([...new Set(bad)]).toEqual([]);
    });

    it("AC 14: no digit in any line or choice text on any path", () => {
      const bad = paths.flatMap((p) =>
        p.steps
          .flatMap((s) => [...texts(s), ...s.choices.map((c) => c.text)])
          .filter((t) => /\d/.test(t)),
      );
      expect([...new Set(bad)]).toEqual([]);
    });

    it("AC 15b: slot_costs is once, on the last line (the prompt) of the step that shows the first slot menu", () => {
      const problems = problemsOn(paths, (p) => {
        const out: string[] = [];
        if (tagCount(p, "tutorial: slot_costs") !== 1) out.push("slot_costs not exactly once");
        const step = p.steps[1] as StoryStep;
        const l = last(step.lines);
        if (!l.tags.includes("tutorial: slot_costs") || l.text !== T.costs)
          out.push("slot_costs is not on the first prompt line");
        if (step.choices.length === 0) out.push("no menu after P0-1");
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 15b: later Stay menus use the plain prompt", () => {
      const afterForage = play(lang, follow(lang, ["stay", "forage"]));
      expect(last(last(afterForage.steps).lines).text).toBe(T.later);
      const afterFire = play(lang, follow(lang, ["stay", "fire", "good"]));
      expect(last(last(afterFire.steps).lines).text).toBe(T.later);
      expect(tagsOf(last(afterForage.steps))).not.toContain("tutorial: slot_costs");
    });

    it("AC 15b: band_result is once, right after the first band line, even when both minigames are played", () => {
      const problems = problemsOn(paths, (p) => {
        const out: string[] = [];
        if (tagCount(p, "tutorial: band_result") !== 1) out.push("band_result not exactly once");
        const firstTrigger = p.steps.findIndex((s) => s.minigame);
        const step = p.steps[firstTrigger + 1] as StoryStep;
        const at = step.lines.findIndex((l) => l.tags.includes("tutorial: band_result"));
        if (at < 1) out.push("band_result is not after the first band line");
        else if (step.lines[at]?.text !== T.brush)
          out.push(`band_result line is "${step.lines[at]?.text}"`);
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 15b: night_cost is once, on the night's opening line", () => {
      const problems = problemsOn(paths, (p) => {
        const out: string[] = [];
        if (tagCount(p, "tutorial: night_cost") !== 1) out.push("night_cost not exactly once");
        const l = finalStep(p).lines.find((x) => x.tags.includes("tutorial: night_cost"));
        if (!l || l.text !== T.evening) out.push(`night_cost line is "${l?.text}"`);
        return out;
      });
      expect(problems).toEqual([]);
    });

    it("AC 15b: no tutorial tag shares a line with a minigame tag", () => {
      const bad = paths.flatMap((p) =>
        p.steps
          .flatMap((s) => s.lines)
          .filter(
            (l) =>
              l.tags.some((t) => t.startsWith("tutorial")) &&
              l.tags.some((t) => t.startsWith("minigame")),
          ),
      );
      expect(bad).toEqual([]);
    });

    it("AC 17: no option is a bare reply (yes, no, do it, let's, ok, okay, igen, nem, csináljuk, gyerünk, rendben, jó) and none is empty", () => {
      const banned = new Set([
        "yes",
        "no",
        "do it",
        "lets",
        "ok",
        "okay",
        "igen",
        "nem",
        "csináljuk",
        "gyerünk",
        "rendben",
        "jó",
      ]);
      const options = [
        ...new Set(paths.flatMap((p) => p.steps.flatMap((s) => s.choices.map((c) => c.text)))),
      ];
      expect(options.length).toBeGreaterThanOrEqual(9);
      expect(options.filter((o) => banned.has(normalize(o)) || normalize(o) === "")).toEqual([]);
    });

    it("the kinds of the first pick and its options come from effects, not text (sanity of the helper)", () => {
      const base = play(lang, []);
      const after = play(lang, [{ choose: 0 }]);
      expect(["stay", "explore"]).toContain(
        classify(base.vars[0] as Vars, last(after.steps), last(after.vars)),
      );
    });
  });
}

describe("EN and HU parity on every path", () => {
  it("for every index trail the final variables, the tag sequence and the choice counts are identical", () => {
    const en = pathsOf("en");
    const hu = pathsOf("hu");
    expect(hu.map((p) => p.key).sort()).toEqual(en.map((p) => p.key).sort());
    const byKey = new Map(hu.map((p) => [p.key, p]));
    const problems: string[] = [];
    for (const e of en) {
      const h = byKey.get(e.key) as Path;
      if (JSON.stringify(e.vars) !== JSON.stringify(h.vars))
        problems.push(`${e.key}: variables differ`);
      if (JSON.stringify(e.steps.map(tagsOf)) !== JSON.stringify(h.steps.map(tagsOf)))
        problems.push(`${e.key}: tags differ`);
      if (
        JSON.stringify(e.steps.map((s) => s.choices.length)) !==
        JSON.stringify(h.steps.map((s) => s.choices.length))
      )
        problems.push(`${e.key}: choice counts differ`);
      if (
        JSON.stringify(e.steps.map((s) => s.lines.length)) !==
        JSON.stringify(h.steps.map((s) => s.lines.length))
      )
        problems.push(`${e.key}: line counts differ`);
    }
    expect(problems).toEqual([]);
  }, 120_000);
});
