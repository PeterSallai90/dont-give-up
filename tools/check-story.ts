import type { Story } from "inkjs";
import { compileLanguage, storyLanguages } from "./ink";

// Story checks, run in CI:
// 1. every language compiles with no errors and no warnings;
// 2. every language has the same knots, stitches and global variables (structure parity);
// 3. a bounded exhaustive playthrough reaches an ending on every path and visits every knot.
const MAX_PATHS = 20000;
const MAX_STEPS = 500;
const problems: string[] = [];

function containerNames(story: Story): string[] {
  const names: string[] = [];
  const root = story.mainContentContainer;
  for (const [name, child] of root.namedContent) {
    names.push(name);
    const sub = (child as unknown as { namedContent?: Map<string, unknown> }).namedContent;
    if (sub) for (const stitch of sub.keys()) names.push(`${name}.${stitch}`);
  }
  return names.filter((n) => n !== "global decl").sort();
}

function variableNames(story: Story): string[] {
  const vars = story.variablesState as unknown as { _globalVariables: Map<string, unknown> };
  return [...vars._globalVariables.keys()].sort();
}

function explore(story: Story, lang: string): void {
  const knots = new Set(containerNames(story).filter((n) => !n.includes(".")));
  const visited = new Set<string>();
  let paths = 0;
  const stack: string[] = [story.state.ToJson()];
  while (stack.length && paths < MAX_PATHS) {
    story.state.LoadJson(stack.pop() ?? "");
    let steps = 0;
    while (story.canContinue && steps++ < MAX_STEPS) story.Continue();
    for (const knot of knots) {
      if ((story.state.VisitCountAtPathString(knot) ?? 0) > 0) visited.add(knot);
    }
    if (story.currentErrors?.length)
      problems.push(`[${lang}] runtime error: ${story.currentErrors.join("; ")}`);
    const choices = story.currentChoices;
    if (choices.length === 0) {
      paths++;
      continue;
    }
    const snapshot = story.state.ToJson();
    for (let i = choices.length - 1; i >= 0; i--) {
      story.state.LoadJson(snapshot);
      story.ChooseChoiceIndex(i);
      stack.push(story.state.ToJson());
    }
  }
  if (paths >= MAX_PATHS)
    console.warn(`[${lang}] stopped after ${MAX_PATHS} paths; coverage is partial`);
  const unvisited = [...knots].filter((k) => !visited.has(k));
  if (unvisited.length) problems.push(`[${lang}] knots never reached: ${unvisited.join(", ")}`);
  console.log(`[${lang}] ${paths} complete paths, ${visited.size}/${knots.size} knots reached`);
}

const languages = storyLanguages();
const shapes = new Map<string, string>();
for (const lang of languages) {
  const { story, errors, warnings } = compileLanguage(lang);
  for (const e of errors) problems.push(`[${lang}] compile error: ${e}`);
  for (const w of warnings) problems.push(`[${lang}] compile warning: ${w}`);
  if (!story) continue;
  shapes.set(
    lang,
    JSON.stringify({ containers: containerNames(story), variables: variableNames(story) }),
  );
  explore(story, lang);
}
const reference = shapes.get("en");
for (const [lang, shape] of shapes) {
  if (reference && shape !== reference) {
    problems.push(`[${lang}] structure differs from en (knots, stitches or variables)`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`story OK: ${languages.join(", ")}`);
