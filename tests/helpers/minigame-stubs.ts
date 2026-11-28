import { vi } from "vitest";
import type {
  GameMode,
  MinigameId,
  MinigameInput,
  MinigameModule,
  MinigameRegistry,
  ModeSource,
} from "../../src/minigames/types";
import type { Band } from "../../src/story/bands";

/** One round of a stub module: the test drives it by hand. */
export interface StubRound {
  readonly input: MinigameInput;
  readonly mode: GameMode;
  /** Number of times the session-facing ready callback was called by the test. */
  readyCalls: number;
  ready(): void;
  /** Resolve the round's promise with anything (also invalid results on purpose). */
  resolve(value: unknown): void;
  reject(error: unknown): void;
}

export interface StubModule extends MinigameModule {
  readonly rounds: StubRound[];
  /** Number of play calls so far. */
  readonly calls: number;
}

export interface StubModuleOptions {
  /** Zero-based play call numbers that throw synchronously instead of returning a promise. */
  throwSyncOn?: readonly number[];
}

export function stubModule(options: StubModuleOptions = {}): StubModule {
  const rounds: StubRound[] = [];
  let calls = 0;
  const mod = {
    rounds,
    get calls() {
      return calls;
    },
    play(input: MinigameInput, mode: GameMode, ready: () => void) {
      const n = calls;
      calls += 1;
      if (options.throwSyncOn?.includes(n)) throw new Error("sync start failure");
      let res!: (v: never) => void;
      let rej!: (e: unknown) => void;
      const promise = new Promise((resolve, reject) => {
        res = resolve as (v: never) => void;
        rej = reject;
      });
      const round: StubRound = {
        input,
        mode,
        readyCalls: 0,
        ready() {
          round.readyCalls += 1;
          ready();
        },
        resolve: (value) => res(value as never),
        reject: (error) => rej(error),
      };
      rounds.push(round);
      return promise as ReturnType<MinigameModule["play"]>;
    },
  };
  return mod;
}

export function stubRegistry(entries: Record<MinigameId, MinigameModule>): MinigameRegistry {
  const map = new Map<MinigameId, MinigameModule>(Object.entries(entries));
  return { get: (id) => map.get(id) };
}

export interface StubMode extends ModeSource {
  set(mode: GameMode): void;
  readonly reads: number;
}

export function stubMode(initial: GameMode): StubMode {
  let mode = initial;
  let reads = 0;
  return {
    getMode() {
      reads += 1;
      return mode;
    },
    set(next) {
      mode = next;
    },
    get reads() {
      return reads;
    },
  };
}

export interface StubModeScript extends ModeSource {
  set(mode: GameMode): void;
  readonly reads: number;
}

/**
 * A mode source that follows a script: the n-th getMode() call takes the n-th step (an Error is
 * thrown, any other value is returned as is, also invalid ones on purpose); after the script it
 * returns `then`, which set() can change.
 */
export function stubModeScript(steps: readonly unknown[], then: GameMode): StubModeScript {
  let current = then;
  let reads = 0;
  return {
    getMode() {
      const n = reads;
      reads += 1;
      if (n < steps.length) {
        const step = steps[n];
        if (step instanceof Error) throw step;
        return step as GameMode;
      }
      return current;
    },
    set(next) {
      current = next;
    },
    get reads() {
      return reads;
    },
  };
}

export function stubComplete(): ReturnType<typeof vi.fn<(band: Band) => void>> {
  return vi.fn<(band: Band) => void>();
}

export function stubInput(id: MinigameId): MinigameInput {
  return { id, params: {} };
}

/** Let queued microtasks (restarts, promise handlers) run; fake timers stay in control. */
export async function flush(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}
