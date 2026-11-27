import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";
import type { Story } from "inkjs";
import type { IFileHandler } from "inkjs/compiler/IFileHandler";

export const STORY_DIR = "story";
export const ROOT_FILE = "main.ink";

export interface CompileResult {
  story: Story | null;
  errors: string[];
  warnings: string[];
}

/** The languages that have a story folder (story/<lang>/main.ink). */
export function storyLanguages(storyDir: string = STORY_DIR): string[] {
  return readdirSync(storyDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Compiler options shared by files and inline sources; errors and warnings are collected. */
function compilerOptions(
  root: string | null,
  errors: string[],
  warnings: string[],
  fileHandler?: IFileHandler,
): CompilerOptions {
  return new CompilerOptions(
    root,
    [],
    true, // countAllVisits: the story checker needs visit counts for every knot
    (message: string, type: number) => {
      // ErrorType: 0 = author note, 1 = warning, 2 = error
      if (type === 2) errors.push(message);
      else if (type === 1) warnings.push(message);
    },
    fileHandler ?? null,
  );
}

function compile(source: string, options: CompilerOptions, errors: string[]): Story | null {
  try {
    return new Compiler(source, options).Compile();
  } catch (err) {
    errors.push(String(err));
    return null;
  }
}

/** Compiles an inline ink source (test fixtures), with the same options as a story file. */
export function compileSource(source: string): CompileResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const story = compile(source, compilerOptions(null, errors, warnings), errors);
  return { story, errors, warnings };
}

/** Compiles story/<lang>/main.ink, resolving INCLUDE lines relative to that folder. */
export function compileLanguage(lang: string, storyDir: string = STORY_DIR): CompileResult {
  const root = resolve(storyDir, lang, ROOT_FILE);
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileHandler = {
    ResolveInkFilename: (name: string): string => join(dirname(root), name),
    LoadInkFileContents: (path: string): string => readFileSync(path, "utf8"),
  };
  const story = compile(
    readFileSync(root, "utf8"),
    compilerOptions(root, errors, warnings, fileHandler),
    errors,
  );
  return { story, errors, warnings };
}

/** Knots and stitches ("knot" and "knot.stitch") of a compiled story, sorted. */
export function containerNames(story: Story): string[] {
  const names: string[] = [];
  const root = story.mainContentContainer;
  for (const [name, child] of root.namedContent) {
    names.push(name);
    const sub = (child as unknown as { namedContent?: Map<string, unknown> }).namedContent;
    if (sub) for (const stitch of sub.keys()) names.push(`${name}.${stitch}`);
  }
  return names.filter((n) => n !== "global decl").sort();
}

/** Global variable names of a compiled story, sorted. */
export function variableNames(story: Story): string[] {
  const vars = story.variablesState as unknown as { _globalVariables: Map<string, unknown> };
  return [...vars._globalVariables.keys()].sort();
}
