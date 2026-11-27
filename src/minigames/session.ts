import { isBand, type Band } from "../story/bands";
import type {
  GameMode,
  MinigameId,
  MinigameInput,
  MinigameRegistry,
  MinigameResult,
  ModeSource,
} from "./types";

export const START_TIMEOUT_MS = 10_000;

export type SessionState = "running" | "result" | "done";
export type SessionAction = "retry" | "continue";

export interface SessionOptions {
  id: MinigameId;
  input: MinigameInput;
  registry: MinigameRegistry;
  modeSource: ModeSource;
  complete(band: Band): void;
  onChange?(session: MinigameSession): void;
}

export interface MinigameSession {
  readonly state: SessionState;
  readonly shownBand: Band | undefined;
  readonly offeredActions: readonly SessionAction[];
  act(action: SessionAction): boolean;
}

type FailReason = "no-module" | "ready-timeout" | "throw" | "bad-band";

export function createSession(options: SessionOptions): MinigameSession {
  const { id, input, registry, modeSource, complete, onChange } = options;
  let token = 0;
  let failures = 0;
  let state: SessionState = "running";
  let shownBand: Band | undefined;
  let offeredActions: readonly SessionAction[] = [];
  let roundMode: GameMode = "normal";
  let readyCalled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const session: MinigameSession = {
    get state() {
      return state;
    },
    get shownBand() {
      return shownBand;
    },
    get offeredActions() {
      return offeredActions;
    },
    act(action) {
      if (state !== "result") return false;
      if (action === "continue") {
        finish(shownBand as Band);
        return true;
      }
      if (action === "retry" && offeredActions.includes("retry")) {
        startRound();
        return true;
      }
      return false;
    },
  };

  function clearTimer(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function changed(): void {
    onChange?.(session);
  }

  function isCurrent(t: number): boolean {
    return t === token && state === "running";
  }

  let started = false;

  function startRound(): void {
    token += 1;
    const t = token;
    state = "running";
    offeredActions = [];
    readyCalled = false;
    clearTimer();
    if (started) changed();
    started = true;
    let module: ReturnType<typeof registry.get>;
    try {
      roundMode = modeSource.getMode();
      module = registry.get(id);
    } catch {
      fail(t, "throw");
      return;
    }
    if (!module) {
      fail(t, "no-module");
      return;
    }
    timer = setTimeout(() => {
      fail(t, "ready-timeout");
    }, START_TIMEOUT_MS);
    const ready = (): void => {
      if (!isCurrent(t) || readyCalled) return;
      readyCalled = true;
      clearTimer();
    };
    let promise: Promise<MinigameResult>;
    try {
      promise = Promise.resolve(module.play(input, roundMode, ready));
    } catch {
      fail(t, "throw");
      return;
    }
    promise.then(
      (result) => {
        onResult(t, result);
      },
      () => {
        fail(t, "throw");
      },
    );
  }

  function onResult(t: number, result: unknown): void {
    if (!isCurrent(t)) return;
    const band = (result as { band?: unknown } | null | undefined)?.band;
    if (!isBand(band)) {
      fail(t, "bad-band");
      return;
    }
    clearTimer();
    failures = 0;
    shownBand = band;
    state = "result";
    offeredActions = roundMode === "easy" ? ["retry", "continue"] : ["continue"];
    changed();
  }

  function fail(t: number, reason: FailReason): void {
    if (!isCurrent(t)) return;
    clearTimer();
    token += 1;
    console.warn("minigame round failed", { id, reason });
    failures += 1;
    if (failures < 2) {
      queueMicrotask(startRound);
    } else {
      finish(shownBand ?? "fair");
    }
  }

  function finish(band: Band): void {
    state = "done";
    offeredActions = [];
    token += 1;
    clearTimer();
    try {
      complete(band);
    } finally {
      changed();
    }
  }

  startRound();
  return session;
}
