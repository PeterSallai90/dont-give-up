import { describe, expect, it } from "vitest";
import { encodeSave } from "../src/game/save-format";
import { SaveStore } from "../src/game/save-store";
import { MemoryStorage } from "../src/platform/storage";
import { StubStorage } from "./helpers/storage-stubs";

const KEY = "dontgiveup.save.1:/dont-give-up/";
const IDS = { en: "en-build-1", hu: "hu-build-1" };
const NOW = new Date("2026-11-27T15:00:00.000Z");

function store(storage: StubStorage | MemoryStorage): SaveStore {
  return new SaveStore({ storage, key: KEY, buildIds: IDS, now: () => NOW });
}

const WRITE = {
  language: "en",
  game_mode: "normal",
  scene: "cabin",
  pending: "fire",
  ink: "{}",
} as const;

function stored(
  over: Record<string, unknown> = {},
  headerOver: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    header: {
      version: 1,
      storyBuildId: IDS.en,
      language: "en",
      timestamp: NOW.toISOString(),
      game_mode: "normal",
      pending: "fire",
      ...headerOver,
    },
    ink: "{}",
    ...over,
  });
}

describe("SaveStore", () => {
  it("writes and reads back a save, filling version, build id and the injected timestamp", async () => {
    const s = store(new StubStorage());
    await s.write(WRITE);
    const save = await s.read();
    expect(save?.header).toEqual({
      version: 1,
      storyBuildId: IDS.en,
      language: "en",
      timestamp: NOW.toISOString(),
      game_mode: "normal",
      scene: "cabin",
      pending: "fire",
    });
    expect(save?.ink).toBe("{}");
  });

  it("uses the build id of the save's own language", async () => {
    const s = store(new StubStorage());
    await s.write({ ...WRITE, language: "hu" });
    expect((await s.read())?.header.storyBuildId).toBe(IDS.hu);
  });

  it("returns null with no save", async () => {
    expect(await store(new StubStorage()).read()).toBeNull();
  });

  it("AC 9: returns null for unreadable data without throwing", async () => {
    const storage = new StubStorage();
    await storage.set(KEY, "{broken");
    expect(await store(storage).read()).toBeNull();
  });

  it("AC 11: a build id mismatch is no save", async () => {
    const storage = new StubStorage();
    await storage.set(KEY, stored({}, { storyBuildId: "other-build" }));
    expect(await store(storage).read()).toBeNull();
  });

  it("AC 11: the build id is compared with the build of the header language", async () => {
    const storage = new StubStorage();
    await storage.set(KEY, stored({}, { language: "hu", storyBuildId: IDS.en }));
    expect(await store(storage).read()).toBeNull();
  });

  it("AC 10: version 0 is no save", async () => {
    const storage = new StubStorage();
    await storage.set(KEY, stored({}, { version: 0 }));
    expect(await store(storage).read()).toBeNull();
  });

  it("AC 10: a newer-version save is no save and is not overwritten until clear()", async () => {
    const storage = new StubStorage();
    const newer = stored({}, { version: 2 });
    await storage.set(KEY, newer);
    const s = store(storage);
    expect(await s.read()).toBeNull();
    await s.write(WRITE);
    expect(await storage.inner.get(KEY)).toBe(newer);
    await s.clear();
    expect(await storage.inner.get(KEY)).toBeNull();
    await s.write(WRITE);
    expect((await s.read())?.header.pending).toBe("fire");
  });

  it("AC 14: a failing set leaves no save, silently", async () => {
    const storage = new StubStorage();
    const s = store(storage);
    await s.write(WRITE);
    storage.failOn.add("set");
    await expect(s.write({ ...WRITE, pending: "patch" })).resolves.toBeUndefined();
    storage.failOn.delete("set");
    expect(await storage.inner.get(KEY)).toBeNull();
  });

  it("AC 14: when set and remove both fail nothing throws", async () => {
    const storage = new StubStorage();
    storage.failOn.add("set").add("remove");
    await expect(store(storage).write(WRITE)).resolves.toBeUndefined();
    await expect(store(storage).clear()).resolves.toBeUndefined();
  });

  it("AC 14: a failing get gives null and does not throw", async () => {
    const storage = new StubStorage();
    await storage.set(KEY, stored());
    storage.failOn.add("get");
    expect(await store(storage).read()).toBeNull();
  });

  it("clear() removes the slot", async () => {
    const storage = new StubStorage();
    const s = store(storage);
    await s.write(WRITE);
    await s.clear();
    expect(await storage.inner.get(KEY)).toBeNull();
  });

  it("only touches its own key", async () => {
    const storage = new StubStorage();
    await store(storage).write(WRITE);
    expect(storage.calls.every((c) => c.endsWith(KEY))).toBe(true);
  });

  it("AC 13: setMode rewrites only game_mode", async () => {
    const storage = new StubStorage();
    const s = store(storage);
    await s.write(WRITE);
    const before = await s.read();
    expect(await s.setMode("easy")).toBe(true);
    const after = await s.read();
    expect(after?.header.game_mode).toBe("easy");
    expect(after?.ink).toBe(before?.ink);
    expect(after?.header.pending).toBe("fire");
    expect(after?.header.scene).toBe("cabin");
    expect(after?.header.language).toBe("en");
  });

  it("AC 13: setMode returns false and writes nothing when there is no valid save", async () => {
    const storage = new StubStorage();
    const s = store(storage);
    expect(await s.setMode("easy")).toBe(false);
    expect(await storage.inner.get(KEY)).toBeNull();
    await storage.set(KEY, "garbage");
    expect(await s.setMode("easy")).toBe(false);
    expect(await storage.inner.get(KEY)).toBe("garbage");
  });

  it("an existing encoded save from encodeSave is readable", async () => {
    const storage = new StubStorage();
    await storage.set(
      KEY,
      encodeSave({
        header: {
          version: 1,
          storyBuildId: IDS.hu,
          language: "hu",
          timestamp: NOW.toISOString(),
          game_mode: "easy",
        },
        ink: "{}",
      }),
    );
    expect((await store(storage).read())?.header.game_mode).toBe("easy");
  });
});
