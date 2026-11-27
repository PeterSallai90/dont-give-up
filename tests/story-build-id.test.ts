import { describe, expect, it } from "vitest";
import { storyBuildId } from "../tools/story-build-id";

describe("story build id", () => {
  it("is 16 lower-case hex characters", () => {
    expect(storyBuildId('{"inkVersion":21}')).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is stable for the same JSON", () => {
    expect(storyBuildId('{"a":1}')).toBe(storyBuildId('{"a":1}'));
  });

  it("changes with one changed character", () => {
    expect(storyBuildId('{"a":1}')).not.toBe(storyBuildId('{"a":2}'));
  });

  it("is the start of the SHA-256 of the exact string", async () => {
    const { createHash } = await import("node:crypto");
    const text = '{"root":["^Hello",["done"]]}';
    expect(storyBuildId(text)).toBe(createHash("sha256").update(text).digest("hex").slice(0, 16));
  });
});
