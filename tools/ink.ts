import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";
import type { Story } from "inkjs";

export const STORY_DIR = "story";
export const ROOT_FILE = "main.ink";

export interface CompileResult {
  story: Story | null;
  errors: string[];
  warnings: string[];
}

/** The languages that have a story folder (story/<lang>/main.ink). */
export function storyLanguages(): string[] {
  return readdirSync(STORY_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Compiles story/<lang>/main.ink, resolving INCLUDE lines relative to that folder. */
export function compileLanguage(lang: string): CompileResult {
  const root = resolve(STORY_DIR, lang, ROOT_FILE);
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileHandler = {
    ResolveInkFilename: (name: string): string => join(dirname(root), name),
    LoadInkFileContents: (path: string): string => readFileSync(path, "utf8"),
  };
  const options = new CompilerOptions(
    root,
    [],
    true, // countAllVisits: the story checker needs visit counts for every knot
    (message: string, type: number) => {
      // ErrorType: 0 = author note, 1 = warning, 2 = error
      if (type === 2) errors.push(message);
      else if (type === 1) warnings.push(message);
    },
    fileHandler,
  );
  const compiler = new Compiler(readFileSync(root, "utf8"), options);
  let story: Story | null = null;
  try {
    story = compiler.Compile();
  } catch (err) {
    errors.push(String(err));
  }
  return { story, errors, warnings };
}
