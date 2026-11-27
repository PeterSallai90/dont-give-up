import { CHECKED_TAGS, type BibleData } from "./bible";
import { splitTags, stripComments, type InkFile } from "./ink-source";

// Story to bible checks: tag values, declared variables and tag parity between languages.

const IDENT = "[A-Za-z_][A-Za-z0-9_]*";

export interface TagUse {
  /** Knot, or knot.stitch; "" before the first knot. */
  place: string;
  key: string;
  value: string;
  file: string;
  line: number;
}

export interface Declaration {
  name: string;
  file: string;
  line: number;
}

/** Checked tags (scene, minigame, tutorial) in source order, one entry per tag. */
export function readTagUses(files: InkFile[]): TagUse[] {
  const uses: TagUse[] = [];
  let knot = "";
  let stitch = "";
  for (const file of files) {
    stripComments(file.text)
      .split(/\r?\n/)
      .forEach((raw, index) => {
        const line = raw.trim();
        let m: RegExpMatchArray | null;
        if ((m = line.match(new RegExp(`^=={1,}\\s*(?:function\\s+)?(${IDENT})`)))) {
          knot = m[1] as string;
          stitch = "";
        } else if ((m = line.match(new RegExp(`^=\\s*(?:function\\s+)?(${IDENT})`)))) {
          stitch = m[1] as string;
        }
        for (const tag of splitTags(raw).tags) {
          const colon = tag.indexOf(":");
          if (colon < 0) continue;
          const key = tag.slice(0, colon).trim();
          if (!(CHECKED_TAGS as readonly string[]).includes(key)) continue;
          uses.push({
            place: stitch ? `${knot}.${stitch}` : knot,
            key,
            value: tag.slice(colon + 1).trim(),
            file: file.path,
            line: index + 1,
          });
        }
      });
  }
  return uses;
}

/** VAR, CONST and LIST declared at top level (every declaration is at top level in ink). */
export function readDeclarations(files: InkFile[]): Declaration[] {
  const out: Declaration[] = [];
  for (const file of files) {
    stripComments(file.text)
      .split(/\r?\n/)
      .forEach((raw, index) => {
        const m = raw.match(new RegExp(`^(?:VAR|CONST|LIST)\\s+(${IDENT})`));
        if (m) out.push({ name: m[1] as string, file: file.path, line: index + 1 });
      });
  }
  return out;
}

export function checkBible(lang: string, files: InkFile[], bible: BibleData): string[] {
  const problems: string[] = [];
  for (const use of readTagUses(files)) {
    const values = bible.tagValues.get(use.key);
    if (values && !values.has(use.value)) {
      problems.push(
        `[${lang}] ${use.file}:${use.line}: tag "# ${use.key}: ${use.value}" has no row in the story bible`,
      );
    }
  }
  for (const decl of readDeclarations(files)) {
    if (!bible.variables.has(decl.name)) {
      problems.push(
        `[${lang}] ${decl.file}:${decl.line}: variable "${decl.name}" has no row in the story bible`,
      );
    }
  }
  return problems;
}

function byPlace(files: InkFile[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const use of readTagUses(files)) {
    const list = map.get(use.place) ?? [];
    list.push(`# ${use.key}: ${use.value}`);
    map.set(use.place, list);
  }
  return map;
}

/** Per knot or stitch, the ordered (tag, value) pairs of lang must equal those of the reference. */
export function checkTagParity(
  reference: { lang: string; files: InkFile[] },
  other: { lang: string; files: InkFile[] },
): string[] {
  const a = byPlace(reference.files);
  const b = byPlace(other.files);
  const problems: string[] = [];
  for (const place of [...new Set([...a.keys(), ...b.keys()])]) {
    const x = (a.get(place) ?? []).join(" ");
    const y = (b.get(place) ?? []).join(" ");
    if (x !== y) {
      problems.push(
        `[${other.lang}] tags differ from ${reference.lang} in ${place === "" ? "the top of the file" : place}: ${reference.lang} has [${x}], ${other.lang} has [${y}]`,
      );
    }
  }
  return problems;
}
