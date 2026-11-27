import { describe, expect, it } from "vitest";
import { BANDS, isBand } from "../src/story/bands";
import { parseMinigameTag } from "../src/story/minigame-tag";

describe("parseMinigameTag (AC 9)", () => {
  it("returns none for no tags and for other tags", () => {
    expect(parseMinigameTag([])).toEqual({ kind: "none" });
    expect(parseMinigameTag(["scene: kitchen"])).toEqual({ kind: "none" });
    expect(parseMinigameTag(["scene"])).toEqual({ kind: "none" });
  });

  it("returns a trigger for a valid id", () => {
    expect(parseMinigameTag(["minigame: fire"])).toEqual({ kind: "trigger", id: "fire" });
    expect(parseMinigameTag(["scene: x", "minigame: patch_2"])).toEqual({
      kind: "trigger",
      id: "patch_2",
    });
  });

  it("ignores extra whitespace", () => {
    expect(parseMinigameTag(["  minigame :  fire  "])).toEqual({ kind: "trigger", id: "fire" });
  });

  it("errors when the id is missing", () => {
    expect(parseMinigameTag(["minigame:"]).kind).toBe("error");
    expect(parseMinigameTag(["minigame:   "]).kind).toBe("error");
  });

  it("errors for an id with a space or a capital", () => {
    expect(parseMinigameTag(["minigame: fire wood"]).kind).toBe("error");
    expect(parseMinigameTag(["minigame: Fire"]).kind).toBe("error");
  });

  it("is none for a key with the same prefix or a value naming minigame", () => {
    expect(parseMinigameTag(["minigames: x"])).toEqual({ kind: "none" });
    expect(parseMinigameTag(["scene: minigame"])).toEqual({ kind: "none" });
  });

  it("errors for a differently cased key", () => {
    expect(parseMinigameTag(["Minigame: fire"]).kind).toBe("error");
  });

  it("errors for a tag with no colon that equals minigame in any case", () => {
    expect(parseMinigameTag(["minigame"]).kind).toBe("error");
    expect(parseMinigameTag(["MINIGAME"]).kind).toBe("error");
  });

  it("errors for two minigame tags, even with the same id", () => {
    expect(parseMinigameTag(["minigame: fire", "minigame: patch"]).kind).toBe("error");
    expect(parseMinigameTag(["minigame: fire", "minigame: fire"]).kind).toBe("error");
  });

  it("names the offending tag in the error message", () => {
    const r = parseMinigameTag(["minigame: Fire"]);
    expect(r.kind === "error" && r.message).toContain("Fire");
  });
});

describe("bands (AC 7)", () => {
  it("lists poor, fair and good", () => {
    expect([...BANDS]).toEqual(["poor", "fair", "good"]);
  });

  it("isBand accepts the three bands only", () => {
    for (const b of BANDS) expect(isBand(b)).toBe(true);
    expect(isBand("")).toBe(false);
    expect(isBand("Good")).toBe(false);
    expect(isBand(undefined)).toBe(false);
    expect(isBand(3)).toBe(false);
  });
});
