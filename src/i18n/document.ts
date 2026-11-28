import { detectLanguage, isLanguage, setLanguage, t, type Language } from "./index";

/** ?lang= wins when supported, then the browser languages, else English. */
export function resolveLanguage(fromUrl: string | null, preferred: readonly string[]): Language {
  return isLanguage(fromUrl) ? fromUrl : detectLanguage(preferred);
}

export interface LanguageTarget {
  title: string;
  documentElement: { lang: string };
}

/** Sets the UI language, the page title and the lang attribute. */
export function applyLanguage(lang: Language, doc: LanguageTarget): void {
  setLanguage(lang);
  doc.title = t("app.title", lang);
  doc.documentElement.lang = lang;
}
