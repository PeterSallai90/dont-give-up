import { describe, expect, it } from "vitest";
import { saveKey } from "../src/platform/save-key";

const ORIGIN = "https://petersallai90.github.io";

describe("storage key per base path", () => {
  it("is namespaced and versioned, with the base path folder", () => {
    expect(saveKey(`${ORIGIN}/dont-give-up/`)).toBe("dontgiveup.save.1:/dont-give-up/");
  });

  it("uses the folder when the page is index.html", () => {
    expect(saveKey(`${ORIGIN}/dont-give-up/index.html`)).toBe(saveKey(`${ORIGIN}/dont-give-up/`));
  });

  it("ignores the query string and the hash", () => {
    expect(saveKey(`${ORIGIN}/dont-give-up/?lang=hu#x`)).toBe(saveKey(`${ORIGIN}/dont-give-up/`));
  });

  it("gives develop, a pull request preview and Capacitor distinct keys", () => {
    const keys = [
      saveKey(`${ORIGIN}/dont-give-up/`),
      saveKey(`${ORIGIN}/dont-give-up/pr-preview/pr-16/?lang=hu`),
      saveKey(`${ORIGIN}/dont-give-up/pr-preview/pr-17/`),
      saveKey("https://localhost/"),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[1]).toBe("dontgiveup.save.1:/dont-give-up/pr-preview/pr-16/");
    expect(keys[3]).toBe("dontgiveup.save.1:/");
  });

  it("is stable for the same url", () => {
    expect(saveKey(`${ORIGIN}/a/b/`)).toBe(saveKey(`${ORIGIN}/a/b/`));
  });
});
