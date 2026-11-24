import en from "./en.json";
import hu from "./hu.json";

export const LANGUAGES = ["en", "hu"] as const;
export type Language = (typeof LANGUAGES)[number];
export type StringKey = keyof typeof en;

const tables: Record<Language, Record<string, string>> = { en, hu };

let current: Language = "en";

export function isLanguage(value: string | null | undefined): value is Language {
  return LANGUAGES.includes(value as Language);
}

export function setLanguage(language: Language): void {
  current = language;
}

export function getLanguage(): Language {
  return current;
}

/** Looks up a UI string; falls back to English, then to the key itself. */
export function t(key: StringKey, language: Language = current): string {
  return tables[language][key] ?? tables.en[key] ?? key;
}

/** Picks the first supported language from a list such as navigator.languages. */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLanguage(base)) return base;
  }
  return "en";
}
