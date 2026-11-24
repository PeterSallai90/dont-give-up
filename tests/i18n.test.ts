import { describe, expect, it } from "vitest";
import { detectLanguage, t } from "../src/i18n";

describe("i18n", () => {
  it("returns the Hungarian text when Hungarian is asked for", () => {
    expect(t("menu.start", "hu")).toBe("Kezdés");
  });

  it("detects Hungarian from a regional tag and falls back to English", () => {
    expect(detectLanguage(["hu-HU", "en-US"])).toBe("hu");
    expect(detectLanguage(["de-DE"])).toBe("en");
  });
});
