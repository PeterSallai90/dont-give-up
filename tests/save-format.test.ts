import { describe, expect, it } from "vitest";
import { decodeSave, encodeSave, SAVE_VERSION, type SaveFile } from "../src/game/save-format";

const SAVE: SaveFile = {
  header: {
    version: 1,
    storyBuildId: "3f9a0c1d2b4e5f60",
    language: "hu",
    timestamp: "2026-11-27T15:00:00.000Z",
    game_mode: "easy",
    scene: "wood_crash",
    pending: "fire",
  },
  ink: '{"inkSaveVersion":10}',
};

type Doc = { header: Record<string, unknown>; ink?: unknown };

function doc(): Doc {
  return JSON.parse(encodeSave(SAVE)) as Doc;
}

function withHeader(change: (h: Record<string, unknown>) => void): string {
  const d = doc();
  change(d.header);
  return JSON.stringify(d);
}

function reason(raw: string): string {
  const r = decodeSave(raw);
  return r.ok ? "ok" : r.reason;
}

describe("save format", () => {
  it("the format version starts at 1", () => {
    expect(SAVE_VERSION).toBe(1);
  });

  it("round-trips a trigger checkpoint", () => {
    expect(decodeSave(encodeSave(SAVE))).toEqual({ ok: true, save: SAVE });
  });

  it("round-trips a save without scene and pending", () => {
    const save: SaveFile = {
      header: {
        version: 1,
        storyBuildId: "x1",
        language: "en",
        timestamp: "2026-11-27T15:00:00.000Z",
        game_mode: "normal",
      },
      ink: "{}",
    };
    const r = decodeSave(encodeSave(save));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.save.header.scene).toBeUndefined();
      expect(r.save.header.pending).toBeUndefined();
    }
  });

  it("AC 9: bad JSON, truncated data and non-objects are no save and never throw", () => {
    const full = encodeSave(SAVE);
    for (const raw of ["", "not json", full.slice(0, full.length - 7), "null", "[]", "42", '"x"']) {
      expect(decodeSave(raw).ok, raw).toBe(false);
    }
  });

  it("AC 9: each required header field missing makes the save invalid", () => {
    for (const field of ["version", "storyBuildId", "language", "timestamp", "game_mode"]) {
      expect(decodeSave(withHeader((h) => (h[field] = undefined))).ok, field).toBe(false);
    }
  });

  it("AC 9: a missing header or a missing ink state makes the save invalid", () => {
    expect(decodeSave(JSON.stringify({ ink: "{}" })).ok).toBe(false);
    const noInk = doc();
    delete noInk.ink;
    expect(decodeSave(JSON.stringify(noInk)).ok).toBe(false);
  });

  it("AC 9: wrong field types make the save invalid", () => {
    const bad: [string, unknown][] = [
      ["storyBuildId", 5],
      ["language", 1],
      ["timestamp", null],
      ["game_mode", true],
      ["scene", 3],
      ["scene", ""],
      ["pending", 7],
    ];
    for (const [field, value] of bad) {
      expect(decodeSave(withHeader((h) => (h[field] = value))).ok, field).toBe(false);
    }
    const inkObject = doc();
    inkObject.ink = { a: 1 };
    expect(decodeSave(JSON.stringify(inkObject)).ok).toBe(false);
  });

  it("AC 9: an unsupported language or game mode makes the save invalid", () => {
    expect(decodeSave(withHeader((h) => (h.language = "fr"))).ok).toBe(false);
    expect(decodeSave(withHeader((h) => (h.game_mode = "hard"))).ok).toBe(false);
  });

  it("AC 9: a pending id that is not a minigame id makes the save invalid", () => {
    for (const id of ["Fire", "9fire", "fi re", "", "fire!", "../x"]) {
      expect(decodeSave(withHeader((h) => (h.pending = id))).ok, id).toBe(false);
    }
    expect(decodeSave(withHeader((h) => (h.pending = "fire_2"))).ok).toBe(true);
  });

  it("AC 10: version 0 is old and version 2 is newer; neither is migrated", () => {
    expect(reason(withHeader((h) => (h.version = 0)))).toBe("version-old");
    expect(reason(withHeader((h) => (h.version = 2)))).toBe("version-new");
    expect(reason(withHeader((h) => (h.version = 99)))).toBe("version-new");
  });

  it("AC 10: a non-integer or non-number version is a shape error", () => {
    expect(reason(withHeader((h) => (h.version = "1")))).toBe("shape");
    expect(reason(withHeader((h) => (h.version = 1.5)))).toBe("shape");
  });

  it("ignores unknown header fields and has no chapter field", () => {
    const r = decodeSave(withHeader((h) => (h.chapter = "one")));
    expect(r.ok).toBe(true);
    expect(encodeSave(SAVE)).not.toContain("chapter");
  });
});
