import { compileLanguage, containerNames, storyLanguages, STORY_DIR, variableNames } from "./ink";
import type { Story } from "inkjs";
import { readInkFiles } from "./ink-source";
import { exploreStories, type ExploreOptions, type LangStats } from "./story-explorer";
import { lintStory } from "./story-lint";

// Story checks, run in CI by tools/check-story.ts:
// 1. every language compiles with no errors and no warnings;
// 2. every language has the same knots, stitches and global variables (structure parity);
// 3. the source lint (tag form, no leading glue, nothing that pruning could not model);
// 4. a bounded exhaustive playthrough, forking on every choice and on every minigame band, reaches
//    every knot and runs without ink errors.

export type CheckOptions = ExploreOptions & { storyDir?: string };

export function checkStory(options: CheckOptions = {}): { problems: string[]; stats: LangStats[] } {
  const storyDir = options.storyDir ?? STORY_DIR;
  const problems: string[] = [];
  const languages = storyLanguages(storyDir);
  const shapes = new Map<string, string>();
  const compiled: { lang: string; story: Story }[] = [];
  for (const lang of languages) {
    const { story, errors, warnings } = compileLanguage(lang, storyDir);
    for (const e of errors) problems.push(`[${lang}] compile error: ${e}`);
    for (const w of warnings) problems.push(`[${lang}] compile warning: ${w}`);
    problems.push(...lintStory(lang, readInkFiles(lang, storyDir)));
    if (!story) continue;
    shapes.set(
      lang,
      JSON.stringify({ containers: containerNames(story), variables: variableNames(story) }),
    );
    compiled.push({ lang, story });
  }
  const reference = shapes.get("en");
  for (const [lang, shape] of shapes) {
    if (reference && shape !== reference) {
      problems.push(`[${lang}] structure differs from en (knots, stitches or variables)`);
    }
  }
  const report = exploreStories(compiled, options);
  problems.push(...report.problems);
  return { problems: [...new Set(problems)], stats: report.stats };
}

/** The first max problems, then "and N more" with the exact count of the rest. */
export function formatReport(problems: string[], max = 20): string[] {
  if (problems.length <= max) return [...problems];
  return [...problems.slice(0, max), `and ${problems.length - max} more`];
}
