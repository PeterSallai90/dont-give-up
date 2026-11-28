import { afterEach, describe, expect, it } from "vitest";
import { getLanguage, setLanguage, t } from "../src/i18n";
import { applyLanguage, resolveLanguage } from "../src/i18n/document";

afterEach(() => setLanguage("en"));

function fakeDoc(): { title: string; documentElement: { lang: string } } {
  return { title: "static", documentElement: { lang: "en" } };
}

describe("AC 17: document title and language", () => {
  it("applyLanguage(hu) sets the Hungarian title, lang and the i18n language", () => {
    const doc = fakeDoc();
    applyLanguage("hu", doc);
    expect(doc.title).toBe(t("app.title", "hu"));
    expect(doc.documentElement.lang).toBe("hu");
    expect(getLanguage()).toBe("hu");
  });

  it("applyLanguage(en) sets the English title and lang", () => {
    const doc = fakeDoc();
    doc.documentElement.lang = "hu";
    applyLanguage("en", doc);
    expect(doc.title).toBe(t("app.title", "en"));
    expect(doc.documentElement.lang).toBe("en");
    expect(getLanguage()).toBe("en");
  });

  it("an unsupported ?lang= and browser language fall back to en", () => {
    expect(resolveLanguage("de", ["de-DE"])).toBe("en");
    expect(resolveLanguage(null, [])).toBe("en");
  });

  it("the browser language is used without ?lang=", () => {
    expect(resolveLanguage(null, ["hu-HU"])).toBe("hu");
    expect(resolveLanguage(null, ["de-DE", "hu"])).toBe("hu");
  });

  it("a supported ?lang= wins over the browser language", () => {
    expect(resolveLanguage("en", ["hu-HU"])).toBe("en");
    expect(resolveLanguage("hu", ["en-US"])).toBe("hu");
  });

  it("an unsupported ?lang= does not hide a supported browser language", () => {
    expect(resolveLanguage("de", ["hu-HU"])).toBe("hu");
  });
});
