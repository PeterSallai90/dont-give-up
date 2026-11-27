import type { StoryLine } from "../story/advance";

const SCENE = /^scene\s*:\s*(\S+)$/;

/** The id of the last "scene: <id>" tag in the lines, or undefined. */
export function lastScene(lines: readonly StoryLine[]): string | undefined {
  let found: string | undefined;
  for (const line of lines) {
    for (const tag of line.tags) {
      const m = SCENE.exec(tag.trim());
      if (m) found = m[1];
    }
  }
  return found;
}
