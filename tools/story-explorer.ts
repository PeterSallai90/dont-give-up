import { createHash } from "node:crypto";
import type { Story } from "inkjs";
import { advance, type Stop, type StoryLine } from "../src/story/advance";
import { BANDS } from "../src/story/bands";
import { containerNames, countReadTargets, variableNames } from "./ink";

/** Cap on explored states (segments) per language. */
export const MAX_PATHS = 20000;
/** Cap on lines in one segment. */
export const MAX_STEPS = 500;
const DEFAULT_TIME_LIMIT_MS = 60_000;

export interface SegmentEvent {
  lang: string;
  trail: string[];
  lines: StoryLine[];
  stop: Stop;
}

export interface ExploreOptions {
  maxPaths?: number;
  maxSteps?: number;
  /** Skip states already explored; default true. */
  prune?: boolean;
  /** Run-time limit over all languages together; default 60 000. */
  timeLimitMs?: number;
  now?: () => number;
  /** Test probe: called for every segment that ends without an error. */
  onSegment?: (segment: SegmentEvent) => void;
}

export interface LangStats {
  lang: string;
  segments: number;
  pruned: number;
  knotsReached: number;
  knotsTotal: number;
  partial: false | "path cap" | "step cap" | "time limit";
}

export interface ExploreReport {
  problems: string[];
  stats: LangStats[];
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function canonical(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k] as Json)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Pruning key of an ink state JSON: everything the future can depend on (variables, call stack with
 * temps and tunnel arguments, offered choices, visited-or-not of every counted container) and
 * nothing it cannot (turn counters, seeds, raw thread numbers, old output). Depends on the state
 * layout of inkjs 2.4.0 (pinned); the stateKey tests are the canary.
 */
export function stateKey(stateJson: string, reads: ReadonlySet<string>): string {
  const state = JSON.parse(stateJson) as Record<string, Json>;
  const ids = new Map<number, number>();
  const id = (n: Json): number => {
    const raw = Number(n);
    let v = ids.get(raw);
    if (v === undefined) {
      v = ids.size;
      ids.set(raw, v);
    }
    return v;
  };
  const flows: Record<string, Json> = {};
  for (const [name, flowJson] of Object.entries((state.flows ?? {}) as Record<string, Json>)) {
    const flow = flowJson as Record<string, Json>;
    const kept: Record<string, Json> = {};
    for (const [k, v] of Object.entries(flow)) {
      if (
        k !== "outputStream" &&
        k !== "callstack" &&
        k !== "choiceThreads" &&
        k !== "currentChoices"
      ) {
        kept[k] = v;
      }
    }
    const stack = (flow.callstack ?? {}) as Record<string, Json>;
    const threads = ((stack.threads ?? []) as Record<string, Json>[]).map((t) => ({
      ...t,
      threadIndex: id(t.threadIndex ?? 0),
    }));
    const choices = ((flow.currentChoices ?? []) as Record<string, Json>[]).map((c) => ({
      ...c,
      originalThreadIndex: id(c.originalThreadIndex ?? 0),
    }));
    const choiceThreads = Object.entries((flow.choiceThreads ?? {}) as Record<string, Json>)
      .map(([k, v]) => {
        const thread = v as Record<string, Json>;
        return [id(Number(k)), { ...thread, threadIndex: id(thread.threadIndex ?? 0) }] as [
          number,
          Json,
        ];
      })
      .sort((a, b) => a[0] - b[0]);
    flows[name] = {
      ...kept,
      callstack: { threads },
      currentChoices: choices,
      choiceThreads,
    } as Json;
  }
  // The visit of an offered choice target (c-N) is left out of the key when the story never reads
  // its count (no "CNT?" on it, which is how a label is compiled): inkjs hides a visited once-only
  // choice, so an offered visited one is sticky. This lets a repeatable menu merge with itself. A
  // target the story reads, by label, stays in the key. "reads" comes from countReadTargets(story).
  const offered = new Set<string>();
  for (const flowJson of Object.values((state.flows ?? {}) as Record<string, Json>)) {
    const choices = ((flowJson as Record<string, Json>).currentChoices ?? []) as Record<
      string,
      Json
    >[];
    for (const c of choices) {
      const target = String(c.targetPath);
      if (/(^|\.)c-\d+$/.test(target) && !reads.has(target)) offered.add(target);
    }
  }
  const visited = Object.entries((state.visitCounts ?? {}) as Record<string, Json>)
    .filter(([path, count]) => Number(count) > 0 && !offered.has(path))
    .map(([path]) => path)
    .sort();
  const key: Record<string, Json> = {
    flows,
    visited,
    variablesState: state.variablesState ?? null,
    evalStack: state.evalStack ?? null,
    currentDivertTarget: state.currentDivertTarget ?? null,
    currentFlowName: state.currentFlowName ?? null,
  };
  return createHash("sha1").update(canonical(key)).digest("hex");
}

/** State JSON with any pending inkjs variable patch applied (a write after a step sits in the patch). */
function snapshotOf(story: Story): string {
  story.state.ApplyAnyPatch();
  return story.state.ToJson();
}

function currentKnot(story: Story): string {
  const path = story.state.currentPathString ?? story.state.previousPointer.path?.toString() ?? "";
  return path.split(/[.\d]/)[0] || "(unknown)";
}

interface Item {
  state: string;
  trail: string[];
}

export function exploreStories(
  stories: { lang: string; story: Story }[],
  options: ExploreOptions = {},
): ExploreReport {
  const maxPaths = options.maxPaths ?? MAX_PATHS;
  const maxSteps = options.maxSteps ?? MAX_STEPS;
  const prune = options.prune ?? true;
  const limit = options.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS;
  const now = options.now ?? (() => performance.now());
  const start = now();
  const problems = new Set<string>();
  const stats: LangStats[] = [];
  let timedOut = false;

  for (const { lang, story } of stories) {
    const add = (message: string, trail: string[]): void => {
      problems.add(`[${lang}] ${message}${trail.length ? ` (trail: ${trail.join(" > ")})` : ""}`);
    };
    const knots = containerNames(story).filter((n) => !n.includes("."));
    const reached = new Set<string>();
    const initial = snapshotOf(story);
    const initialMg = new Map<string, unknown>();
    for (const name of variableNames(story)) {
      if (name.startsWith("mg_")) initialMg.set(name, story.variablesState.$(name));
    }
    const reads = countReadTargets(story);
    const seen = new Set<string>();
    if (prune) seen.add(stateKey(initial, reads));
    const stack: Item[] = [{ state: initial, trail: [] }];
    const entry: LangStats = {
      lang,
      segments: 0,
      pruned: 0,
      knotsReached: 0,
      knotsTotal: knots.length,
      partial: timedOut ? "time limit" : false,
    };
    const push = (state: string, trail: string[], fork = false): void => {
      // A band write is never merged, so every "id:band" trail that fails is reported.
      if (prune && !fork) {
        const key = stateKey(state, reads);
        if (seen.has(key)) {
          entry.pruned++;
          return;
        }
        seen.add(key);
      }
      stack.push({ state, trail });
    };
    const setPartial = (reason: "path cap" | "step cap" | "time limit"): void => {
      if (!entry.partial) entry.partial = reason;
    };

    while (stack.length > 0 && !timedOut) {
      if (now() - start > limit) {
        timedOut = true;
        problems.add(
          `too slow: ${((now() - start) / 1000).toFixed(1)} s (limit ${(limit / 1000).toFixed(1)} s)`,
        );
        setPartial("time limit");
        break;
      }
      if (entry.segments >= maxPaths) {
        setPartial("path cap");
        break;
      }
      const { state, trail } = stack.pop() as Item;
      entry.segments++;
      story.state.LoadJson(state);
      let result: ReturnType<typeof advance> | undefined;
      let failure: unknown;
      try {
        result = advance(story, maxSteps);
      } catch (e) {
        failure = e;
      }
      for (const knot of knots) {
        if (!reached.has(knot) && (story.state.VisitCountAtPathString(knot) ?? 0) > 0) {
          reached.add(knot);
        }
      }
      if (!result) {
        add(failure instanceof Error ? failure.message : String(failure), trail);
        continue;
      }
      options.onSegment?.({ lang, trail, lines: result.lines, stop: result.stop });
      const stop = result.stop;
      if (stop.kind === "trigger") {
        const name = `mg_${stop.id}`;
        if (!initialMg.has(name)) {
          add(`minigame "${stop.id}": ${name} is not declared`, trail);
          continue;
        }
        if (initialMg.get(name) !== "") {
          add(`minigame "${stop.id}": ${name} must be a string with initial ""`, trail);
          continue;
        }
        const lead = result.lines[result.lines.length - 1];
        if (!lead || lead.text === "") {
          add(`minigame ${stop.id} in knot ${currentKnot(story)} has no lead-in text`, trail);
          continue;
        }
        const snapshot = snapshotOf(story);
        for (let i = BANDS.length - 1; i >= 0; i--) {
          const band = BANDS[i] as string;
          story.state.LoadJson(snapshot);
          story.variablesState.$(name, band);
          push(snapshotOf(story), [...trail, `${stop.id}:${band}`], true);
        }
      } else if (stop.kind === "choices") {
        const snapshot = snapshotOf(story);
        const count = story.currentChoices.length;
        for (let i = count - 1; i >= 0; i--) {
          story.state.LoadJson(snapshot);
          story.ChooseChoiceIndex(i);
          push(snapshotOf(story), trail);
        }
      } else if (stop.kind === "limit") {
        setPartial("step cap");
      }
    }
    entry.knotsReached = reached.size;
    const missing = knots.filter((k) => !reached.has(k));
    if (missing.length > 0) {
      const why = entry.partial
        ? `not reached, coverage partial: ${entry.partial}`
        : "not reached, all paths explored";
      problems.add(`[${lang}] knots never reached: ${missing.join(", ")} (${why})`);
    }
    stats.push(entry);
  }
  return { problems: [...problems], stats };
}
