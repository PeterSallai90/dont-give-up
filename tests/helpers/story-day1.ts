import { StoryRunner, type StoryStep } from "../../src/story/runner";
import { BANDS, type Band } from "../../src/story/bands";
import { compileLanguage } from "../../tools/ink";

/** The twelve story variables (AC 1), in the order the tests read them. */
export const VAR_NAMES = [
  "warmth",
  "food",
  "hope",
  "trust",
  "memory",
  "camp",
  "trunk",
  "cabin_days",
  "dog",
  "dog_care",
  "mg_fire",
  "mg_patch",
] as const;

export type Vars = Record<(typeof VAR_NAMES)[number], unknown>;

export type Move = { choose: number } | { band: Band };

/** What an option does, found from its effect and never from its text. */
export type Kind =
  | "stay"
  | "explore"
  | "fire"
  | "patch"
  | "forage"
  | "loft"
  | "rest_play"
  | "share"
  | "refuse"
  | `unknown:${string}`;

export interface Played {
  steps: StoryStep[];
  /** vars[i] are the variables at the stop of steps[i]. */
  vars: Vars[];
  runner: StoryRunner;
}

export interface Path extends Played {
  trail: Move[];
  key: string;
}

const cache = new Map<string, string>();

/** Compiles story/<lang>/main.ink (throws on errors and warnings) and caches the story JSON. */
export function storyJson(lang: string): string {
  const hit = cache.get(lang);
  if (hit !== undefined) return hit;
  const { story, errors, warnings } = compileLanguage(lang);
  if (!story || errors.length > 0 || warnings.length > 0) {
    throw new Error(
      `story/${lang}/main.ink did not compile cleanly: ${[...errors, ...warnings].join("; ")}`,
    );
  }
  const json = story.ToJson() ?? "";
  cache.set(lang, json);
  return json;
}

export function readVars(runner: StoryRunner): Vars {
  const out: Record<string, unknown> = {};
  for (const name of VAR_NAMES) out[name] = runner.getVariable(name);
  return out as Vars;
}

export function trailKey(trail: Move[]): string {
  return trail.map((m) => ("choose" in m ? `c${m.choose}` : `b:${m.band}`)).join(",");
}

/** A fresh StoryRunner, next(), then every move in order. */
export function play(lang: string, trail: Move[]): Played {
  const runner = new StoryRunner(storyJson(lang));
  const steps: StoryStep[] = [];
  const vars: Vars[] = [];
  const stop = (): void => {
    steps.push(runner.next());
    vars.push(readVars(runner));
  };
  stop();
  for (const move of trail) {
    if ("choose" in move) runner.choose(move.choose);
    else runner.completeMinigame(move.band);
    stop();
  }
  return { steps, vars, runner };
}

const MAX_PATHS = 2000;
const MAX_STEPS_PER_PATH = 200;

/** Every complete path by replay: forks every choice index and every band until the story ends. */
export function allPaths(lang: string): Path[] {
  const out: Path[] = [];
  const visit = (trail: Move[]): void => {
    if (trail.length > MAX_STEPS_PER_PATH)
      throw new Error(`a path of ${lang} is longer than ${MAX_STEPS_PER_PATH} moves`);
    const played = play(lang, trail);
    const last = played.steps[played.steps.length - 1] as StoryStep;
    if (last.minigame) {
      for (const band of BANDS) visit([...trail, { band }]);
    } else if (last.choices.length > 0) {
      for (const c of last.choices) visit([...trail, { choose: c.index }]);
    } else {
      if (out.length >= MAX_PATHS) throw new Error(`more than ${MAX_PATHS} paths in ${lang}`);
      out.push({ ...played, trail, key: trailKey(trail) });
    }
  };
  visit([]);
  return out;
}

/** The variables that differ between two stops (mg_* excluded: the game writes those). */
export function deltas(before: Vars, after: Vars): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of VAR_NAMES) {
    if (name.startsWith("mg_")) continue;
    const a = before[name];
    const b = after[name];
    if (a === b) continue;
    out[name] = typeof a === "number" && typeof b === "number" ? b - a : b;
  }
  return out;
}

const eq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Names an option from the effect it had: the stop before it and the stop after it. */
export function classify(before: Vars, after: StoryStep, afterVars: Vars): Kind {
  if (after.minigame === "fire" || after.minigame === "patch") return after.minigame;
  if (before.camp !== afterVars.camp) {
    if (afterVars.camp === "cart") return "stay";
    if (afterVars.camp === "wood") return "explore";
  }
  if (after.ended) return afterVars.dog === "ours" ? "share" : "refuse";
  const d = deltas(before, afterVars);
  if (eq(d, { food: 2 })) return "forage";
  if (eq(d, { memory: 1, trust: 1 }) || eq(d, { trust: 1, memory: 1 })) return "loft";
  if (eq(d, { hope: 2 })) return "rest_play";
  return `unknown:${JSON.stringify(d)}`;
}

/** The kind of each option of the menu at the end of the trail, by replaying every option. */
export function optionKinds(lang: string, trail: Move[]): Kind[] {
  const base = play(lang, trail);
  const last = base.steps[base.steps.length - 1] as StoryStep;
  const before = base.vars[base.vars.length - 1] as Vars;
  return last.choices.map((c) => {
    const next = play(lang, [...trail, { choose: c.index }]);
    return classify(
      before,
      next.steps[next.steps.length - 1] as StoryStep,
      next.vars[next.vars.length - 1] as Vars,
    );
  });
}

export type PlanToken = Kind | Band;

/** Builds the move trail that picks, at each menu, the option of the named kind (and each band). */
export function follow(lang: string, plan: PlanToken[]): Move[] {
  const trail: Move[] = [];
  for (const token of plan) {
    if ((BANDS as readonly string[]).includes(token)) {
      trail.push({ band: token as Band });
      continue;
    }
    const kinds = optionKinds(lang, trail);
    const index = kinds.indexOf(token as Kind);
    if (index < 0)
      throw new Error(`no option of kind "${token}" here (offered: ${kinds.join(", ")})`);
    const played = play(lang, trail);
    const last = played.steps[played.steps.length - 1] as StoryStep;
    trail.push({ choose: (last.choices[index] as { index: number }).index });
  }
  return trail;
}

/** The kind of every pick on a path, in order, with the band after a minigame. */
export function pathEvents(path: Path): string[] {
  const out: string[] = [];
  for (let i = 0; i < path.trail.length; i++) {
    const move = path.trail[i] as Move;
    if ("band" in move) {
      out.push(move.band);
      continue;
    }
    const next = path.steps[i + 1] as StoryStep;
    out.push(classify(path.vars[i] as Vars, next, path.vars[i + 1] as Vars));
  }
  return out;
}

/** All text lines of a step, tags removed. */
export const texts = (step: StoryStep): string[] => step.lines.map((l) => l.text);

/** Lowercase, letters and spaces only. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tags of a step in order, as "key: value". */
export const tagsOf = (step: StoryStep): string[] => step.lines.flatMap((l) => l.tags);
