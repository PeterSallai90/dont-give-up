export type MinigameTag =
  { kind: "none" } | { kind: "trigger"; id: string } | { kind: "error"; message: string };

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Reads the "minigame: <id>" trigger out of the tags of one line. */
export function parseMinigameTag(tags: readonly string[]): MinigameTag {
  const ids: string[] = [];
  for (const tag of tags) {
    const t = tag.trim();
    const colon = t.indexOf(":");
    if (colon < 0) {
      if (t.toLowerCase() === "minigame") {
        return { kind: "error", message: `minigame tag has no id: "${tag}"` };
      }
      continue;
    }
    const key = t.slice(0, colon).trim();
    if (key.toLowerCase() !== "minigame") continue;
    if (key !== "minigame") {
      return { kind: "error", message: `minigame tag key must be lower case: "${tag}"` };
    }
    const id = t.slice(colon + 1).trim();
    if (!ID_PATTERN.test(id)) {
      return { kind: "error", message: `minigame tag has a bad id: "${tag}"` };
    }
    ids.push(id);
  }
  if (ids.length > 1) {
    return { kind: "error", message: `more than one minigame tag on one line: ${ids.join(", ")}` };
  }
  const [id] = ids;
  return id === undefined ? { kind: "none" } : { kind: "trigger", id };
}
