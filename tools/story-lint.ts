import { parseMinigameTag } from "../src/story/minigame-tag";
import {
  braceGroups,
  countedNames,
  lineKind,
  splitTags,
  stripComments,
  type BraceGroup,
  type InkFile,
} from "./ink-source";

// Source lint for story files (issue #22, AC 9 and 11):
// - the minigame tag form: the tag ends the last lead-in text line, never alone, never on a choice;
// - no leading glue, because the runner steps line by line;
// - the story reads nothing from ink that pruned explorer states could differ in: visit counts only
//   as visited-or-not, no TURNS, no randomness, no sequences.

const FORBIDDEN_CALL = /\b(TURNS_SINCE|TURNS|SEED_RANDOM|RANDOM)\s*\(/;
const SEQUENCE_HEADER = /^\s*(stopping|cycle|once|shuffle(\s+(once|stopping))?)\s*:/;

type Token = { kind: "name" | "word" | "num" | "op"; text: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /->|<-|&&|\|\||==|!=|>=|<=|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*|\d+(?:\.\d+)?|\S/g;
  let divertTarget = false;
  for (const m of text.matchAll(re)) {
    const t = m[0];
    if (t === "->" || t === "<-") {
      divertTarget = true;
      tokens.push({ kind: "op", text: t });
    } else if (/^[A-Za-z_]/.test(t)) {
      if (divertTarget) divertTarget = false;
      else tokens.push({ kind: "name", text: t });
    } else if (/^\d/.test(t)) tokens.push({ kind: "num", text: t });
    else tokens.push({ kind: "op", text: t });
  }
  return tokens;
}

const BEFORE_OK = new Set(["not", "!", "(", "and", "or", "&&", "||"]);
const AFTER_OK = new Set([")", "and", "or", "&&", "||"]);

/** Problems with counted names in a condition or logic text: only visited-or-not forms pass. */
function countReads(text: string, counted: Set<string>): boolean {
  const tokens = tokenize(text);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i] as Token;
    if (tok.kind !== "name" || !counted.has(tok.text)) continue;
    const prev = tokens[i - 1];
    const prevOk = prev === undefined || BEFORE_OK.has(prev.text);
    let j = i + 1;
    const op = tokens[j];
    if (op && (op.text === ">" || op.text === "==")) {
      const num = tokens[j + 1];
      if (num && num.kind === "num" && num.text === "0") j += 2;
    }
    const after = tokens[j];
    const afterOk = after === undefined || AFTER_OK.has(after.text);
    if (!prevOk || !afterOk) return true;
  }
  return false;
}

function hasCountedName(text: string, counted: Set<string>): boolean {
  return tokenize(text).some((t) => t.kind === "name" && counted.has(t.text));
}

/** Blanks the inside of nested brace groups, keeping newlines and length. */
function maskNested(content: string): string {
  let depth = 0;
  let out = "";
  for (const ch of content) {
    if (ch === "{") {
      depth++;
      out += " ";
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      out += " ";
    } else out += depth > 0 && ch !== "\n" ? " " : ch;
  }
  return out;
}

export function lintStory(lang: string, files: InkFile[]): string[] {
  const out: string[] = [];
  const counted = countedNames(files);
  for (const file of files) {
    const text = stripComments(file.text);
    const lines = text.split(/\r?\n/);
    const report = (line: number, rule: string): void => {
      out.push(`[${lang}] ${file.path}:${line}: ${rule}`);
    };

    lines.forEach((raw, index) => {
      const lineNo = index + 1;
      const kind = lineKind(raw);
      const { tags } = splitTags(raw);
      const minigame = parseMinigameTag(tags).kind !== "none";
      if (kind === "tags-only" && minigame) {
        report(lineNo, "minigame tag on its own line; put it at the end of the last lead-in line");
      }
      if (kind === "choice" && minigame) report(lineNo, "minigame tag on a choice line");
      if (raw.trim().startsWith("<>")) {
        report(lineNo, "line starts with glue; glue goes only at the end of a line");
      }
      const call = raw.match(FORBIDDEN_CALL);
      if (call) report(lineNo, `${call[1]} is not allowed: the explorer prunes equal states`);
      if (
        kind === "logic" &&
        raw.trim().startsWith("~") &&
        countReads(raw.trim().slice(1), counted)
      ) {
        report(lineNo, "visit count read beyond visited-or-not (allowed: x, not x, x > 0, x == 0)");
      }
    });

    const lineOf = (group: BraceGroup): number => group.line;
    const checkCondition = (cond: string, line: number): void => {
      if (countReads(cond, counted)) {
        report(line, "visit count read beyond visited-or-not (allowed: x, not x, x > 0, x == 0)");
      }
    };

    for (const group of braceGroups(text)) {
      const lineNo = lineOf(group);
      const raw = lines[lineNo - 1] ?? "";
      const kind = lineKind(raw);
      if (kind === "logic") continue;
      if (kind === "choice") {
        const before = raw
          .slice(0, group.column - 1)
          .replace(/\{[^}]*\}/g, " ")
          .replace(/\([^)]*\)/g, " ");
        if (/^[\s*+-]*$/.test(before)) {
          checkCondition(group.content, lineNo);
          continue;
        }
      }
      const top = maskNested(group.content);
      const header = top.split("\n")[0] ?? "";
      if (SEQUENCE_HEADER.test(header)) {
        report(lineNo, "sequences, cycles, once-only lists and shuffles are not allowed");
        continue;
      }
      const branches = top
        .split("\n")
        .map((l, i) => ({ l: l.trim(), i }))
        .filter(({ l }) => l.startsWith("-") && !l.startsWith("->"));
      if (group.multiline && branches.length > 0) {
        const hc = header.indexOf(":");
        if (hc >= 0) checkCondition(header.slice(0, hc), lineNo);
        for (const { l, i } of branches) {
          const colon = l.indexOf(":");
          if (colon > 0) checkCondition(l.slice(1, colon), lineNo + i);
        }
        continue;
      }
      const colon = top.indexOf(":");
      const pipe = top.indexOf("|");
      if (pipe >= 0 && (colon < 0 || colon > pipe)) {
        report(lineNo, "sequences, cycles, once-only lists and shuffles are not allowed");
      } else if (colon >= 0) {
        checkCondition(top.slice(0, colon), lineNo);
      } else if (hasCountedName(top, counted)) {
        report(lineNo, "prints a visit count; use the condition form {x: ...}");
      }
    }
  }
  return out;
}
