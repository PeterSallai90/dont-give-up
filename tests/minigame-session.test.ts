import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_MODES as MODE_GAME_MODES } from "../src/game/mode";
import { START_TIMEOUT_MS, createSession } from "../src/minigames/session";
import { GAME_MODES, type GameMode } from "../src/minigames/types";
import {
  flush,
  stubComplete,
  stubInput,
  stubMode,
  stubModule,
  stubRegistry,
  type StubModule,
  type StubRound,
} from "./helpers/minigame-stubs";
import type { Band } from "../src/story/bands";

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  warn.mockRestore();
});

interface Setup {
  mod: StubModule;
  mode: ReturnType<typeof stubMode>;
  complete: ReturnType<typeof stubComplete>;
  onChange: ReturnType<typeof vi.fn>;
  session: ReturnType<typeof createSession>;
  input: ReturnType<typeof stubInput>;
}

function setup(mode: GameMode = "normal", id = "fire", mod: StubModule = stubModule()): Setup {
  const modeSource = stubMode(mode);
  const complete = stubComplete();
  const onChange = vi.fn();
  const input = stubInput(id);
  const session = createSession({
    id,
    input,
    registry: stubRegistry({ [id]: mod }),
    modeSource,
    complete,
    onChange,
  });
  return { mod, mode: modeSource, complete, onChange, session, input };
}

function nth(mod: StubModule, n: number): StubRound {
  const r = mod.rounds[n];
  if (!r) throw new Error(`no round ${n}`);
  return r;
}
const last = (mod: StubModule): StubRound => nth(mod, mod.rounds.length - 1);

async function showBand(mod: StubModule, band: unknown): Promise<void> {
  const r = last(mod);
  r.ready();
  r.resolve(band);
  await flush();
}

async function failRound(mod: StubModule): Promise<void> {
  last(mod).reject(new Error("boom"));
  await flush();
}

describe("AC 1: contract types", () => {
  it("play receives input, mode and a ready callback", () => {
    const { mod, input } = setup("easy");
    expect(mod.calls).toBe(1);
    expect(nth(mod, 0).input).toBe(input);
    expect(nth(mod, 0).mode).toBe("easy");
  });
  it("GameMode has one definition: mode.ts re-exports the types.ts constant", () => {
    expect(MODE_GAME_MODES).toBe(GAME_MODES);
    expect([...GAME_MODES]).toEqual(["easy", "normal"]);
  });
});

describe("AC 2: session start and result", () => {
  it("calls play once at once and is running with nothing offered", () => {
    const { mod, session } = setup();
    expect(mod.calls).toBe(1);
    expect(session.state).toBe("running");
    expect(session.shownBand).toBeUndefined();
    expect(session.offeredActions).toEqual([]);
  });
  it("a valid band moves to result and sets shownBand", async () => {
    const { mod, session } = setup();
    await showBand(mod, { band: "good" });
    expect(session.state).toBe("result");
    expect(session.shownBand).toBe("good");
  });
  it("onChange is called when the session moves from running to result", async () => {
    const { mod, onChange } = setup();
    onChange.mockClear();
    await showBand(mod, { band: "fair" });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0].state).toBe("result");
  });
});

describe("AC 3: Normal mode", () => {
  it("offers only continue; retry is rejected and play is not called again", async () => {
    const { mod, session } = setup("normal");
    await showBand(mod, { band: "poor" });
    expect(session.offeredActions).toEqual(["continue"]);
    expect(session.act("retry")).toBe(false);
    await flush();
    expect(mod.calls).toBe(1);
    expect(session.state).toBe("result");
  });
  it("continue calls complete once with the band and ends in done", async () => {
    const { mod, session, complete } = setup("normal");
    await showBand(mod, { band: "good" });
    expect(complete).not.toHaveBeenCalled();
    expect(session.act("continue")).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith("good");
    expect(session.state).toBe("done");
    expect(session.offeredActions).toEqual([]);
  });
});

describe("AC 4: Easy mode retry", () => {
  it("offers retry and continue; retry plays again with the same input object", async () => {
    const { mod, session, input } = setup("easy");
    await showBand(mod, { band: "good" });
    expect(session.offeredActions).toEqual(["retry", "continue"]);
    expect(session.act("retry")).toBe(true);
    expect(session.state).toBe("running");
    expect(session.offeredActions).toEqual([]);
    expect(mod.calls).toBe(2);
    expect(last(mod).input).toBe(input);
  });
  it("unlimited retries: only the last accepted band is completed, once", async () => {
    const { mod, session, complete } = setup("easy");
    for (const band of ["good", "fair", "poor"] as Band[]) {
      await showBand(mod, { band });
      expect(session.shownBand).toBe(band);
      expect(session.act("retry")).toBe(true);
    }
    await showBand(mod, { band: "poor" });
    expect(complete).not.toHaveBeenCalled();
    session.act("continue");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith("poor");
    expect(mod.calls).toBe(4);
  });
});

describe("AC 5: no skip", () => {
  it("while running nothing is offered and both actions are rejected", () => {
    const { session, complete } = setup("easy");
    expect(session.offeredActions).toEqual([]);
    expect(session.act("continue")).toBe(false);
    expect(session.act("retry")).toBe(false);
    expect(complete).not.toHaveBeenCalled();
    expect(session.state).toBe("running");
  });
  it("complete is not called before continue", async () => {
    const { mod, complete } = setup("easy");
    await showBand(mod, { band: "good" });
    expect(complete).not.toHaveBeenCalled();
  });
  it("after done both actions are rejected and complete stays at one call", async () => {
    const { mod, session, complete } = setup("easy");
    await showBand(mod, { band: "good" });
    session.act("continue");
    expect(session.act("continue")).toBe(false);
    expect(session.act("retry")).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(mod.calls).toBe(1);
  });
  it("no timer is left in result and done", async () => {
    const { mod, session } = setup("easy");
    await showBand(mod, { band: "good" });
    expect(vi.getTimerCount()).toBe(0);
    session.act("continue");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("AC 6: mode is read at every round start", () => {
  it("reads the mode once per round", async () => {
    const { mod, mode, session } = setup("easy");
    expect(mode.reads).toBe(1);
    await showBand(mod, { band: "fair" });
    expect(mode.reads).toBe(1);
    session.act("retry");
    expect(mode.reads).toBe(2);
  });
  it("Normal round, mode switched to Easy mid-round: only continue is offered", async () => {
    const { mod, mode, session } = setup("normal");
    mode.set("easy");
    await showBand(mod, { band: "good" });
    expect(session.offeredActions).toEqual(["continue"]);
  });
  it("Easy band shown, mode switched to Normal: retry is still offered and runs in Normal", async () => {
    const { mod, mode, session } = setup("easy");
    await showBand(mod, { band: "good" });
    mode.set("normal");
    expect(session.offeredActions).toEqual(["retry", "continue"]);
    expect(session.act("retry")).toBe(true);
    expect(last(mod).mode).toBe("normal");
    await showBand(mod, { band: "fair" });
    expect(session.offeredActions).toEqual(["continue"]);
  });
});

describe("AC 7: a failed round restarts", () => {
  it("no module for the id restarts once and never reaches result", async () => {
    const modeSource = stubMode("normal");
    const complete = stubComplete();
    const session = createSession({
      id: "nope",
      input: stubInput("nope"),
      registry: stubRegistry({}),
      modeSource,
      complete,
    });
    await flush();
    expect(session.state).toBe("running");
    expect(modeSource.reads).toBe(2);
    expect(complete).not.toHaveBeenCalled();
    await flush();
    expect(complete).toHaveBeenCalledWith("fair");
  });
  it("a synchronous throw restarts once (play called twice)", async () => {
    const { mod, session } = setup("normal", "fire", stubModule({ throwSyncOn: [0] }));
    await flush();
    expect(mod.calls).toBe(2);
    expect(session.state).toBe("running");
  });
  it("a rejection restarts once", async () => {
    const { mod, session } = setup();
    await failRound(mod);
    expect(mod.calls).toBe(2);
    expect(session.state).toBe("running");
  });
  it("no ready in START_TIMEOUT_MS restarts: nothing at 9999 ms, restart at 10000 ms", async () => {
    expect(START_TIMEOUT_MS).toBe(10_000);
    const { mod, session } = setup();
    await vi.advanceTimersByTimeAsync(9999);
    expect(mod.calls).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mod.calls).toBe(2);
    expect(session.state).toBe("running");
  });
  it.each([
    ["empty string", { band: "" }],
    ["unknown band", { band: "great" }],
    ["undefined band", { band: undefined }],
    ["missing result", undefined],
    ["null result", null],
  ])("an invalid result (%s) is a failed round and never reaches result", async (_name, value) => {
    const { mod, session, complete } = setup();
    await showBand(mod, value);
    expect(session.state).toBe("running");
    expect(session.shownBand).toBeUndefined();
    expect(mod.calls).toBe(2);
    expect(complete).not.toHaveBeenCalled();
  });
  it("a throw after ready (mid-round) is a failed round", async () => {
    const { mod, session } = setup();
    last(mod).ready();
    await vi.advanceTimersByTimeAsync(40_000);
    await failRound(mod);
    expect(mod.calls).toBe(2);
    expect(session.state).toBe("running");
  });
  it("after ready the round has no timeout: a band after 60 s still works", async () => {
    const { mod, session } = setup();
    last(mod).ready();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mod.calls).toBe(1);
    last(mod).resolve({ band: "good" });
    await flush();
    expect(session.state).toBe("result");
    expect(session.shownBand).toBe("good");
  });
  it("a failed start inside an Easy retry restarts too", async () => {
    const { mod, session } = setup("easy");
    await showBand(mod, { band: "good" });
    session.act("retry");
    await failRound(mod);
    expect(mod.calls).toBe(3);
    expect(session.state).toBe("running");
  });
});

describe("AC 8: two failed rounds in a row write the fallback", () => {
  it("two failures write fair once, state done, no action offered", async () => {
    const { mod, session, complete } = setup();
    await failRound(mod);
    await failRound(mod);
    expect(mod.calls).toBe(2);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith("fair");
    expect(session.state).toBe("done");
    expect(session.offeredActions).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("two timeouts write fair", async () => {
    const { complete, session } = setup();
    await vi.advanceTimersByTimeAsync(2 * START_TIMEOUT_MS);
    expect(complete).toHaveBeenCalledWith("fair");
    expect(session.state).toBe("done");
  });
  it("fail, success, fail: the count was reset, no fallback", async () => {
    const { mod, session, complete } = setup("easy");
    await failRound(mod);
    await showBand(mod, { band: "good" });
    session.act("retry");
    await failRound(mod);
    expect(complete).not.toHaveBeenCalled();
    expect(session.state).toBe("running");
  });
  it("ready alone does not reset the count: ready then throw, twice, is the fallback", async () => {
    const { mod, complete } = setup();
    last(mod).ready();
    await failRound(mod);
    last(mod).ready();
    await failRound(mod);
    expect(complete).toHaveBeenCalledWith("fair");
  });
  it("(a) Easy good, retry fails twice: good is written", async () => {
    const { mod, session, complete } = setup("easy");
    await showBand(mod, { band: "good" });
    session.act("retry");
    await failRound(mod);
    await failRound(mod);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith("good");
    expect(session.state).toBe("done");
  });
  it("(a) Easy poor, retry fails twice: poor is written", async () => {
    const { mod, session, complete } = setup("easy");
    await showBand(mod, { band: "poor" });
    session.act("retry");
    await failRound(mod);
    await failRound(mod);
    expect(complete).toHaveBeenCalledWith("poor");
  });
  it("(a) the last shown band wins, better or worse than earlier ones", async () => {
    const { mod, session, complete } = setup("easy");
    await showBand(mod, { band: "good" });
    session.act("retry");
    await showBand(mod, { band: "poor" });
    session.act("retry");
    await failRound(mod);
    await failRound(mod);
    expect(complete).toHaveBeenCalledWith("poor");
  });
  it("(b) no band was ever shown: fair", async () => {
    const { mod, complete } = setup("easy");
    await failRound(mod);
    await failRound(mod);
    expect(complete).toHaveBeenCalledWith("fair");
  });
  it("(c) an earlier good for the same id cannot reach a new failing session: fair", async () => {
    const first = setup("easy", "fire");
    await showBand(first.mod, { band: "good" });
    first.session.act("continue");
    expect(first.complete).toHaveBeenCalledWith("good");
    const second = setup("easy", "fire");
    expect(second.session.shownBand).toBeUndefined();
    await failRound(second.mod);
    await failRound(second.mod);
    expect(second.complete).toHaveBeenCalledWith("fair");
  });
  it("(d) a patch session after a fire session never uses the fire band: fair", async () => {
    const fire = setup("easy", "fire");
    await showBand(fire.mod, { band: "good" });
    fire.session.act("continue");
    const patch = setup("easy", "patch");
    await failRound(patch.mod);
    await failRound(patch.mod);
    expect(patch.complete).toHaveBeenCalledTimes(1);
    expect(patch.complete).toHaveBeenCalledWith("fair");
    expect(fire.complete).toHaveBeenCalledTimes(1);
  });
  it("resume: a new session for the same id is fresh, running, counters at 0", async () => {
    const before = setup("easy", "fire");
    await showBand(before.mod, { band: "good" });
    const after = setup("easy", "fire");
    expect(after.session.state).toBe("running");
    expect(after.session.shownBand).toBeUndefined();
    expect(after.session.offeredActions).toEqual([]);
    await failRound(after.mod);
    expect(after.session.state).toBe("running");
    expect(after.complete).not.toHaveBeenCalled();
    expect(after.mod.calls).toBe(2);
  });
});

describe("AC 8a: abandoned and finished rounds are ignored", () => {
  it("a late good from a timed-out round 1 changes nothing", async () => {
    const { mod, session, complete } = setup();
    const round1 = nth(mod, 0);
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    expect(mod.calls).toBe(2);
    round1.resolve({ band: "good" });
    await flush();
    expect(session.state).toBe("running");
    expect(session.shownBand).toBeUndefined();
    expect(complete).not.toHaveBeenCalled();
  });
  it("a late good does not overwrite the fallback band", async () => {
    const { mod, session, complete } = setup();
    const round1 = nth(mod, 0);
    await vi.advanceTimersByTimeAsync(2 * START_TIMEOUT_MS);
    expect(complete).toHaveBeenCalledWith("fair");
    round1.resolve({ band: "good" });
    await flush();
    expect(session.shownBand).toBeUndefined();
    expect(session.state).toBe("done");
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it("a late ready from round 1 does not clear round 2's timer", async () => {
    const { mod } = setup();
    const round1 = nth(mod, 0);
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    round1.ready();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    expect(mod.calls).toBe(2);
  });
  it("a late rejection from round 1 is not counted as a failure and is not unhandled", async () => {
    const { mod, session, complete } = setup();
    const round1 = nth(mod, 0);
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS);
    round1.reject(new Error("late"));
    await flush();
    expect(session.state).toBe("running");
    expect(complete).not.toHaveBeenCalled();
    expect(mod.calls).toBe(2);
    await showBand(mod, { band: "good" });
    expect(session.state).toBe("result");
  });
  it("a result after done does nothing", async () => {
    const { mod, session, complete } = setup("easy");
    const round1 = nth(mod, 0);
    await showBand(mod, { band: "fair" });
    session.act("continue");
    round1.resolve({ band: "good" });
    await flush();
    expect(session.state).toBe("done");
    expect(session.shownBand).toBe("fair");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith("fair");
  });
  it("a result from a replaced round (before a retry) is ignored", async () => {
    const { mod, session } = setup("easy");
    const round1 = nth(mod, 0);
    await showBand(mod, { band: "fair" });
    session.act("retry");
    round1.resolve({ band: "good" });
    await flush();
    expect(session.shownBand).toBe("fair");
    expect(session.state).toBe("running");
  });
  it("ready called twice is harmless", async () => {
    const { mod, session } = setup();
    last(mod).ready();
    last(mod).ready();
    await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS * 2);
    expect(mod.calls).toBe(1);
    last(mod).resolve({ band: "poor" });
    await flush();
    expect(session.state).toBe("result");
  });
});

describe("AC 9: technical fallback, no message", () => {
  it("each failure logs one console.warn with the id and a reason", async () => {
    const { mod } = setup("normal", "fire");
    await failRound(mod);
    expect(warn).toHaveBeenCalledTimes(1);
    const text = JSON.stringify(warn.mock.calls[0]);
    expect(text).toContain("fire");
    await failRound(mod);
    expect(warn).toHaveBeenCalledTimes(2);
  });
  it("the fallback offers no action; complete is the only output", async () => {
    const { mod, session, complete, onChange } = setup("easy");
    await failRound(mod);
    await failRound(mod);
    expect(session.offeredActions).toEqual([]);
    expect(session.act("continue")).toBe(false);
    expect(session.act("retry")).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(Object.keys(session).sort()).toEqual(
      ["act", "offeredActions", "shownBand", "state"].sort(),
    );
    for (const call of onChange.mock.calls) expect(call[0].state).not.toBe("result");
  });
  it("a module that fails synchronously every time ends in the fallback without recursion", async () => {
    const { complete, mod } = setup("normal", "fire", stubModule({ throwSyncOn: [0, 1, 2, 3] }));
    await flush();
    await flush();
    expect(mod.calls).toBe(2);
    expect(complete).toHaveBeenCalledWith("fair");
  });
});
