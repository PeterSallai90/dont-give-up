import type { Story } from "inkjs";
import { parseMinigameTag } from "./minigame-tag";

export interface StoryLine {
  text: string;
  tags: string[];
}

export type Stop =
  { kind: "trigger"; id: string } | { kind: "choices" } | { kind: "end" } | { kind: "limit" };

/** parseMinigameTag reported a malformed minigame tag. */
export class MinigameTagError extends Error {}

/**
 * Reads one line without inkjs look-ahead. Continue() runs on past the end of a line to look
 * for glue and keeps that evaluated content when it prints no text, so a band branch could be
 * decided before the band is written.
 */
export function readLine(story: Story): StoryLine {
  story.state.didSafeExit = false;
  story.state.ResetOutput();
  do {
    story.ContinueSingleStep();
  } while (!story.state.outputStreamEndsInNewline && story.canContinue);
  if (story.hasError) throw new Error(story.currentErrors?.join("; ") ?? "ink runtime error");
  return { text: (story.currentText ?? "").trim(), tags: [...(story.currentTags ?? [])] };
}

/** Reads lines until the first trigger line, a choice point, the end, or maxLines lines. */
export function advance(
  story: Story,
  maxLines: number = Infinity,
): { lines: StoryLine[]; stop: Stop } {
  const lines: StoryLine[] = [];
  let read = 0;
  while (story.canContinue) {
    if (read >= maxLines) return { lines, stop: { kind: "limit" } };
    read++;
    const { text, tags } = readLine(story);
    if (text || tags.length > 0) lines.push({ text, tags });
    const tag = parseMinigameTag(tags);
    if (tag.kind === "error") throw new MinigameTagError(tag.message);
    if (tag.kind === "trigger") return { lines, stop: { kind: "trigger", id: tag.id } };
  }
  return { lines, stop: { kind: story.currentChoices.length > 0 ? "choices" : "end" } };
}
