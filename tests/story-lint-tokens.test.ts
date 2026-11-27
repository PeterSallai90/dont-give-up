import { describe, expect, it } from "vitest";
import { lintStory } from "../tools/story-lint";

const lint = (body: string): string[] =>
  lintStory("en", [
    { path: "t.ink", text: "=== cart ===\nHi.\n-> END\n=== lodge ===\n" + body + "\n-> END\n" },
  ]);

describe("story lint tokens (#13)", () => {
  it("ignores a string literal that equals a knot name", () => {
    expect(lint('VAR x = ""\n{x == "cart": hi}')).toEqual([]);
  });
  it("treats name( as a function call, not a count", () => {
    expect(lint("{cart(2): hi}")).toEqual([]);
  });
  it("still catches a real count read", () => {
    expect(lint("{cart > 1: hi}").length).toBe(1);
  });
  it("still allows visited-or-not", () => {
    expect(lint("{cart: hi}")).toEqual([]);
  });
});
