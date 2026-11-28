import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GameModeSource } from "../src/game/mode-source";
import { bootedRunning, seedPendingSave, shellRig, stored } from "./helpers/shell-rig";

describe("GameModeSource without a flow", () => {
  it("getMode throws before any pick and current is undefined", () => {
    const s = new GameModeSource();
    expect(s.current()).toBeUndefined();
    expect(() => s.getMode()).toThrow();
  });

  it("pick is kept in memory, change without a flow only updates the pick, reset drops it", async () => {
    const s = new GameModeSource();
    s.pick("easy");
    expect(s.getMode()).toBe("easy");
    expect(s.current()).toBe("easy");
    await s.change("normal");
    expect(s.getMode()).toBe("normal");
    s.reset();
    expect(s.current()).toBeUndefined();
    expect(() => s.getMode()).toThrow();
  });
});

describe("AC 6: mode change", () => {
  it("getMode returns the new mode at once, before the write finishes", async () => {
    const r = await bootedRunning("easy");
    const pending = r.shell.modeSource.change("normal");
    expect(r.shell.modeSource.getMode()).toBe("normal");
    expect(r.shell.modeSource.current()).toBe("normal");
    await pending;
  });

  it("two quick taps: the last tap wins and is the last write", async () => {
    const r = await bootedRunning("easy");
    await r.shell.flow?.next();
    const a = r.shell.modeSource.change("normal");
    const b = r.shell.modeSource.change("easy");
    const c = r.shell.modeSource.change("normal");
    await Promise.all([a, b, c]);
    expect(r.shell.modeSource.getMode()).toBe("normal");
    expect((await stored(r.storage))?.header.game_mode).toBe("normal");
  });

  it("the flow is the only copy: flow.mode matches", async () => {
    const r = await bootedRunning("easy");
    await r.shell.modeSource.change("normal");
    expect(r.shell.flow?.mode).toBe("normal");
  });
});

describe("AC 7: the mode persists", () => {
  it("resume, change, reboot a new shell on the same storage: the change is the mode", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "en", "normal");
    const first = shellRig({ storage: seed.storage });
    await first.shell.boot();
    expect(first.shell.flow?.mode).toBe("normal");
    await first.shell.modeSource.change("easy");
    const second = shellRig({ storage: seed.storage });
    await second.shell.boot();
    expect(second.shell.flow?.mode).toBe("easy");
    expect((await stored(second.storage))?.header.game_mode).toBe("easy");
  });

  it("only the save modules write game_mode (static scan of src)", () => {
    const allowed = new Set(["save-store.ts", "save-flow.ts", "save-format.ts"]);
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".ts") && !allowed.has(name)) {
          if (readFileSync(p, "utf8").includes("game_mode")) offenders.push(p);
        }
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });
});

describe("AC 8: mode before any save", () => {
  it("the pick stays in memory, storage stays empty, and the first save carries it", async () => {
    const r = await bootedRunning("normal");
    const setsBefore = r.storage.calls.filter((c) => c.startsWith("set:")).length;
    await expect(r.shell.modeSource.change("easy")).resolves.toBeUndefined();
    expect(r.shell.modeSource.getMode()).toBe("easy");
    expect(await stored(r.storage)).toBeNull();
    expect(r.storage.calls.filter((c) => c.startsWith("set:")).length).toBe(setsBefore);
    await r.shell.flow?.saveNow();
    expect((await stored(r.storage))?.header.game_mode).toBe("easy");
  });

  it("after newGame and a new pick the old pick is gone", async () => {
    const r = await bootedRunning("easy");
    await r.shell.modeSource.change("normal");
    await r.shell.newGame();
    expect(r.shell.modeSource.current()).toBeUndefined();
    await r.shell.pick("easy");
    expect(r.shell.modeSource.getMode()).toBe("easy");
    expect(r.shell.flow?.mode).toBe("easy");
  });
});

describe("AC 9: mode write fails", () => {
  it("failing set: no throw, the in-memory mode applies, a reboot finds the saved mode", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "en", "normal");
    const r = shellRig({ storage: seed.storage });
    await r.shell.boot();
    r.storage.failOn.add("set");
    await expect(r.shell.modeSource.change("easy")).resolves.toBeUndefined();
    expect(r.shell.modeSource.getMode()).toBe("easy");
    r.storage.failOn.clear();
    const again = shellRig({ storage: seed.storage });
    await again.shell.boot();
    expect(again.shell.flow?.mode).toBe("normal");
  });

  it("failing get: no throw, the in-memory mode applies", async () => {
    const r = await bootedRunning("normal");
    await r.shell.flow?.next();
    r.storage.failOn.add("get");
    await expect(r.shell.modeSource.change("easy")).resolves.toBeUndefined();
    expect(r.shell.modeSource.getMode()).toBe("easy");
  });
});
