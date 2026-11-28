import { describe, expect, it } from "vitest";
import {
  KEY,
  IDS,
  bootedRunning,
  seedPendingSave,
  shellRig,
  stored,
  storedText,
} from "./helpers/shell-rig";

describe("AC 1, 14: no save shows the start screen", () => {
  it("empty storage: onStart once, no game, no story loaded", async () => {
    const r = shellRig();
    await r.shell.boot();
    expect(r.onStart).toHaveBeenCalledTimes(1);
    expect(r.onGameReady).not.toHaveBeenCalled();
    expect(r.loaded).toEqual([]);
    expect(r.shell.state).toBe("start");
    expect(r.shell.hasGame).toBe(false);
    expect(r.shell.flow).toBeUndefined();
  });

  it("no mode is preselected on the start screen", async () => {
    const r = shellRig();
    await r.shell.boot();
    expect(r.shell.modeSource.current()).toBeUndefined();
  });
});

describe("AC 2: a pick starts the game", () => {
  it("pick(easy) loads the story once in the current language and hands over without a step", async () => {
    const r = shellRig({ language: "hu" });
    await r.shell.boot();
    expect(await r.shell.pick("easy")).toBe(true);
    expect(r.loaded).toEqual(["hu"]);
    expect(r.onGameReady).toHaveBeenCalledTimes(1);
    const args = r.onGameReady.mock.calls[0] as unknown[];
    expect(args[0]).toBe(r.shell.flow);
    expect(args[1]).toBeUndefined();
    expect(r.shell.flow?.mode).toBe("easy");
    expect(r.shell.flow?.language).toBe("hu");
    expect(r.shell.state).toBe("running");
  });

  it("pick(normal) starts a Normal game", async () => {
    const r = await bootedRunning("normal");
    expect(r.shell.flow?.mode).toBe("normal");
    expect(r.shell.modeSource.getMode()).toBe("normal");
  });

  it("a second tap during the hand-off starts nothing twice", async () => {
    const r = shellRig();
    await r.shell.boot();
    const [a, b] = await Promise.all([r.shell.pick("easy"), r.shell.pick("normal")]);
    expect([a, b]).toEqual([true, false]);
    expect(r.loaded).toEqual(["en"]);
    expect(r.onGameReady).toHaveBeenCalledTimes(1);
    expect(r.shell.flow?.mode).toBe("easy");
  });

  it("a pick while a game runs is ignored", async () => {
    const r = await bootedRunning("easy");
    const flow = r.shell.flow;
    expect(await r.shell.pick("normal")).toBe(false);
    expect(r.shell.flow).toBe(flow);
    expect(r.onGameReady).toHaveBeenCalledTimes(1);
  });
});

describe("AC 12: confirmed new game", () => {
  it("the key is gone before the start screen shows", async () => {
    const r = await bootedRunning("normal");
    await r.shell.flow?.next();
    expect(await storedText(r.storage)).not.toBeNull();
    let atStart: string | null | undefined;
    const before = r.onStart.mock.calls.length;
    r.onStart.mockImplementation(() => {
      atStart = r.storage.inner.get(KEY) as unknown as string | null;
    });
    await r.shell.newGame();
    expect(r.onStart.mock.calls.length).toBe(before + 1);
    expect(await atStart).toBeNull();
    expect(await storedText(r.storage)).toBeNull();
    expect(r.shell.state).toBe("start");
    expect(r.shell.hasGame).toBe(false);
  });

  it("DoR 1: the old game can no longer write (late saveNow and setMode)", async () => {
    const r = await bootedRunning("normal");
    const old = r.shell.flow;
    if (!old) throw new Error("no flow");
    await old.next();
    await r.shell.newGame();
    expect(await storedText(r.storage)).toBeNull();
    const setsBefore = r.storage.calls.filter((c) => c.startsWith("set:")).length;
    await old.saveNow();
    await old.setMode("easy");
    await old.next();
    expect(await storedText(r.storage)).toBeNull();
    expect(r.storage.calls.filter((c) => c.startsWith("set:")).length).toBe(setsBefore);
  });

  it("DoR 1: a write still in flight when the game is dropped does not survive", async () => {
    const r = await bootedRunning("normal");
    const old = r.shell.flow;
    if (!old) throw new Error("no flow");
    const late = old.next();
    await r.shell.newGame();
    await late;
    expect(await storedText(r.storage)).toBeNull();
  });

  it("DoR 2: the mode memory is reset, nothing is preselected", async () => {
    const r = await bootedRunning("easy");
    await r.shell.newGame();
    expect(r.shell.modeSource.current()).toBeUndefined();
    expect(() => r.shell.modeSource.getMode()).toThrow();
  });

  it("onGameDropped gets the old flow once", async () => {
    const r = await bootedRunning("easy");
    const old = r.shell.flow;
    await r.shell.newGame();
    expect(r.onGameDropped).toHaveBeenCalledTimes(1);
    expect(r.onGameDropped.mock.calls[0]?.[0]).toBe(old);
    expect(r.shell.flow).toBeUndefined();
  });

  it("the next pick gives a new flow that starts the story from the beginning", async () => {
    const r = await bootedRunning("easy");
    const old = r.shell.flow;
    const first = await old?.next();
    await r.shell.newGame();
    expect(await r.shell.pick("normal")).toBe(true);
    const fresh = r.shell.flow;
    expect(fresh).toBeDefined();
    expect(fresh).not.toBe(old);
    expect(fresh?.mode).toBe("normal");
    const again = await fresh?.next();
    expect(again?.lines.map((l) => l.text)).toEqual(first?.lines.map((l) => l.text));
    expect(r.onGameReady).toHaveBeenCalledTimes(2);
  });

  it("edge: the story fails to load after the pick: start screen stays, silent, and a second pick works", async () => {
    const r = shellRig();
    await r.shell.boot();
    r.loadFails.count = 1;
    expect(await r.shell.pick("easy")).toBe(false);
    expect(r.shell.state).toBe("start");
    expect(r.onGameReady).not.toHaveBeenCalled();
    expect(r.shell.hasGame).toBe(false);
    expect(r.shell.modeSource.current()).toBeUndefined();
    expect(await r.shell.pick("normal")).toBe(true);
    expect(r.shell.state).toBe("running");
    expect(r.shell.flow?.mode).toBe("normal");
    expect(r.onGameReady).toHaveBeenCalledTimes(1);
  });
});

describe("AC 13: new game when storage fails", () => {
  it("remove throws: the start screen still shows", async () => {
    const r = await bootedRunning("normal");
    r.storage.failOn.add("remove");
    const before = r.onStart.mock.calls.length;
    await expect(r.shell.newGame()).resolves.toBeUndefined();
    expect(r.onStart.mock.calls.length).toBe(before + 1);
    expect(r.shell.state).toBe("start");
  });
});

describe("AC 15: corrupted, newer or mismatched save", () => {
  async function pickAndSave(r: ReturnType<typeof shellRig>): Promise<void> {
    expect(await r.shell.pick("easy")).toBe(true);
    await r.shell.flow?.next();
    const save = await stored(r.storage);
    expect(save).not.toBeNull();
    expect(save?.header.game_mode).toBe("easy");
    expect(save?.header.version).toBe(1);
  }

  it("corrupted text: start screen, then a pick replaces it", async () => {
    const r = shellRig();
    await r.storage.inner.set(KEY, "{not json");
    await r.shell.boot();
    expect(r.onStart).toHaveBeenCalledTimes(1);
    expect(r.onGameReady).not.toHaveBeenCalled();
    await pickAndSave(r);
  });

  it("version 2 save: start screen, a pick clears it and the first write lands", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "en", "normal");
    const save = await stored(seed.storage);
    if (!save) throw new Error("no seed");
    save.header.version = 2;
    const r = shellRig();
    await r.storage.inner.set(KEY, JSON.stringify(save));
    await r.shell.boot();
    expect(r.onStart).toHaveBeenCalledTimes(1);
    expect(r.onGameReady).not.toHaveBeenCalled();
    await pickAndSave(r);
  });

  it("build mismatch: start screen, a pick replaces the save", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "en", "normal", { en: "old-build", hu: "old-build" });
    const r = shellRig({ storage: seed.storage });
    await r.shell.boot();
    expect(r.onStart).toHaveBeenCalledTimes(1);
    expect(r.onGameReady).not.toHaveBeenCalled();
    await pickAndSave(r);
    expect((await stored(r.storage))?.header.storyBuildId).toBe(IDS.en);
  });
});

describe("AC 16, 19: a valid save resumes without the start screen", () => {
  it("language is applied from the save before onGameReady(flow, step), each once", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "hu", "easy");
    const r = shellRig({ storage: seed.storage, language: "en" });
    await r.shell.boot();
    expect(r.onStart).not.toHaveBeenCalled();
    expect(r.applyLanguage).toHaveBeenCalledTimes(1);
    expect(r.applyLanguage.mock.calls[0]?.[0]).toBe("hu");
    expect(r.onGameReady).toHaveBeenCalledTimes(1);
    expect(r.events).toEqual(["language", "ready"]);
    const args = r.onGameReady.mock.calls[0] as unknown[];
    expect(args[0]).toBe(r.shell.flow);
    expect((args[1] as { minigame?: string }).minigame).toBe("fire");
  });

  it("the saved mode applies and no pick is offered", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "en", "easy");
    const r = shellRig({ storage: seed.storage });
    await r.shell.boot();
    expect(r.shell.flow?.mode).toBe("easy");
    expect(r.shell.modeSource.getMode()).toBe("easy");
    expect(r.shell.state).toBe("running");
    expect(r.shell.hasGame).toBe(true);
    expect(await r.shell.pick("normal")).toBe(false);
    expect(r.shell.flow?.mode).toBe("easy");
  });
});
