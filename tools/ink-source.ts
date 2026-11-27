import { readdirSync, readFileSync } from "node:fs";
import { STORY_DIR } from "./ink";

// Source-level helpers for .ink files: plain functions on strings (except readInkFiles), shared
// by the story lint and, later, the bible checks.

export interface InkFile {
  /** Path as shown in messages: forward slashes, starting at the story folder. */
  path: string;
  text: string;
}

function walk(dir: string, shown: string, out: InkFile[]): void {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    const shownPath = `${shown}/${entry.name}`;
    if (entry.isDirectory()) walk(path, shownPath, out);
    else if (entry.name.endsWith(".ink"))
      out.push({ path: shownPath, text: readFileSync(path, "utf8") });
  }
}

/** Every .ink file under <storyDir>/<lang>/, recursive and sorted: this covers INCLUDEd files. */
export function readInkFiles(lang: string, storyDir: string = STORY_DIR): InkFile[] {
  const base = `${storyDir.replace(/\\/g, "/").replace(/\/+$/, "")}/${lang}`;
  const out: InkFile[] = [];
  walk(base, base, out);
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Blanks "//" and "/* *\/" comments with spaces; line count and columns stay the same. */
export function stripComments(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i] as string;
    const next = text[i + 1];
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n" && text[i] !== "\r") {
        out += " ";
        i++;
      }
    } else if (ch === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        const c = text[i] as string;
        out += c === "\n" || c === "\r" ? c : " ";
        i++;
      }
      if (i < text.length) {
        out += "  ";
        i += 2;
      }
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/** Splits one comment-free line at the first unescaped "#" outside braces. */
export function splitTags(line: string): { content: string; tags: string[] } {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "\\") i++;
    else if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (ch === "#" && depth === 0) {
      const tags = line
        .slice(i + 1)
        .split(/(?<!\\)#/)
        .map((t) => t.trim())
        .filter((t) => t !== "");
      return { content: line.slice(0, i), tags };
    }
  }
  return { content: line, tags: [] };
}

export type LineKind =
  "blank" | "tags-only" | "choice" | "gather" | "knot" | "stitch" | "logic" | "text";

export function lineKind(line: string): LineKind {
  const t = line.trim();
  if (t === "") return "blank";
  if (t.startsWith("#") && splitTags(t).content.trim() === "") return "tags-only";
  if (t.startsWith("*") || t.startsWith("+")) return "choice";
  if (t.startsWith("-") && !t.startsWith("->")) return "gather";
  if (t.startsWith("==")) return "knot";
  if (t.startsWith("=")) return "stitch";
  if (t.startsWith("~") || /^(VAR|CONST|LIST|INCLUDE|EXTERNAL)\b/.test(t)) return "logic";
  return "text";
}

export interface BraceGroup {
  /** Offset of "{" and of the matching "}" (or the end of the text when unclosed). */
  start: number;
  end: number;
  /** 1-based line and column of the "{". */
  line: number;
  column: number;
  /** Text between the braces. */
  content: string;
  multiline: boolean;
  /** 0 for an outermost group. */
  depth: number;
}

/** Brace groups {...} of a text, nested ones included, in order of their opening brace. */
export function braceGroups(text: string): BraceGroup[] {
  const groups: BraceGroup[] = [];
  const stack: BraceGroup[] = [];
  let line = 1;
  let column = 1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    if (ch === "\\") {
      i++;
      column += 2;
      continue;
    }
    if (ch === "{") {
      const group: BraceGroup = {
        start: i,
        end: text.length,
        line,
        column,
        content: "",
        multiline: false,
        depth: stack.length,
      };
      groups.push(group);
      stack.push(group);
    } else if (ch === "}") {
      const group = stack.pop();
      if (group) {
        group.end = i;
        group.content = text.slice(group.start + 1, i);
        group.multiline = group.content.includes("\n");
      }
    }
    if (ch === "\n") {
      line++;
      column = 1;
    } else column++;
  }
  for (const group of stack) {
    group.content = text.slice(group.start + 1);
    group.multiline = group.content.includes("\n");
  }
  return groups;
}

const IDENT = "[A-Za-z_][A-Za-z0-9_]*";

function paramNames(list: string | undefined): string[] {
  if (!list) return [];
  return list
    .split(",")
    .map((p) =>
      p
        .replace(/->/g, " ")
        .replace(/\bref\b/, " ")
        .trim(),
    )
    .filter((p) => new RegExp(`^${IDENT}$`).test(p));
}

/**
 * Names inkjs keeps a visit count for (knots, stitches, labelled gathers and choices, also as
 * knot.stitch and so on), minus VAR, CONST, LIST, temp and parameter names, which cannot be told
 * apart from a count without ink's scope rules and are therefore never linted as counts.
 */
export function countedNames(files: InkFile[]): Set<string> {
  const counted = new Set<string>();
  const other = new Set<string>();
  for (const file of files) {
    let knot = "";
    let stitch = "";
    for (const raw of stripComments(file.text).split(/\r?\n/)) {
      const line = raw.trim();
      let m: RegExpMatchArray | null;
      if (
        (m = line.match(new RegExp(`^=={1,}\\s*(?:function\\s+)?(${IDENT})\\s*(?:\\(([^)]*)\\))?`)))
      ) {
        knot = m[1] as string;
        stitch = "";
        counted.add(knot);
        for (const p of paramNames(m[2])) other.add(p);
      } else if (
        (m = line.match(new RegExp(`^=\\s*(?:function\\s+)?(${IDENT})\\s*(?:\\(([^)]*)\\))?`)))
      ) {
        stitch = m[1] as string;
        counted.add(stitch);
        if (knot) counted.add(`${knot}.${stitch}`);
        for (const p of paramNames(m[2])) other.add(p);
      } else if (
        (m = line.match(new RegExp(`^(?:[*+]\\s*)+\\(\\s*(${IDENT})\\s*\\)`))) ||
        (m = line.match(new RegExp(`^(?:-\\s*)+\\(\\s*(${IDENT})\\s*\\)`)))
      ) {
        const label = m[1] as string;
        counted.add(label);
        if (knot) counted.add(`${knot}.${label}`);
        if (knot && stitch) counted.add(`${knot}.${stitch}.${label}`);
      } else if ((m = line.match(new RegExp(`^(?:VAR|CONST|LIST)\\s+(${IDENT})`)))) {
        other.add(m[1] as string);
      }
      const temp = line.match(new RegExp(`^~\\s*temp\\s+(${IDENT})`));
      if (temp) other.add(temp[1] as string);
    }
  }
  for (const name of other) counted.delete(name);
  return counted;
}
