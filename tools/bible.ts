import { existsSync, readFileSync } from "node:fs";

// Reads the story bible tables the story check compares the ink against. Plain functions on text.

export const BIBLE_FILE = "docs/narrative/story-bible.md";

export const CHECKED_TAGS = ["scene", "minigame", "tutorial"] as const;

export interface BibleData {
  /** Tag key to the values the bible lists (scene values come from the places table). */
  tagValues: Map<string, Set<string>>;
  variables: Set<string>;
  /** Missing or empty tables; when not empty the check fails and names them. */
  problems: string[];
}

/** The rows of the first table under a "## <heading>" heading, as cell lists (header and rule skipped). */
export function tableRows(markdown: string, heading: string): string[][] | null {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start < 0) return null;
  const rows: string[][] = [];
  let inTable = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = (lines[i] as string).trim();
    if (/^##? /.test(line)) break;
    if (line.startsWith("|")) {
      inTable = true;
      rows.push(
        line
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim()),
      );
    } else if (inTable) break;
  }
  return rows.slice(2);
}

function ticks(cell: string | undefined): string[] {
  return [...(cell ?? "").matchAll(/`([^`]+)`/g)].map((m) => (m[1] as string).trim());
}

export function parseBible(markdown: string | null): BibleData {
  const data: BibleData = { tagValues: new Map(), variables: new Set(), problems: [] };
  if (markdown === null) {
    data.problems.push(`bible ${BIBLE_FILE} is missing`);
    return data;
  }
  const need = (heading: string): string[][] => {
    const rows = tableRows(markdown, heading);
    if (rows === null) data.problems.push(`bible table "${heading}" is missing from ${BIBLE_FILE}`);
    else if (rows.length === 0)
      data.problems.push(`bible table "${heading}" has no rows in ${BIBLE_FILE}`);
    return rows ?? [];
  };
  const tags = need("Tags");
  const scenes = need("Places and scene values");
  const variables = need("Story variables");
  for (const row of tags) {
    const m = (row[0] ?? "").match(/^`#\s*([a-z_]+)\s*:/);
    if (m) data.tagValues.set(m[1] as string, new Set(ticks(row[1])));
  }
  if (scenes.length > 0) {
    data.tagValues.set("scene", new Set(scenes.flatMap((r) => ticks(r[0]).slice(0, 1))));
  }
  if (tags.length > 0) {
    for (const key of CHECKED_TAGS) {
      if (!data.tagValues.has(key))
        data.problems.push(`bible Tags table has no row for "# ${key}:"`);
    }
  }
  for (const row of variables)
    for (const name of ticks(row[0]).slice(0, 1)) data.variables.add(name);
  return data;
}

export function readBible(file: string = BIBLE_FILE): string | null {
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}
