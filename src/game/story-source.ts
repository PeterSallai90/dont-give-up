import type { Language } from "../i18n";
import buildIds from "../generated/story-build.json";

export const STORY_BUILD_IDS = buildIds as Record<Language, string>;

/** One explicit import per language, so only the played language is downloaded. */
export function loadStory(lang: Language): Promise<string | object> {
  return lang === "hu"
    ? import("../generated/story.hu.json").then((m) => m.default as object)
    : import("../generated/story.en.json").then((m) => m.default as object);
}
