import { isLanguage, type Language } from "../i18n";
import { ID_PATTERN } from "../story/minigame-tag";
import { isGameMode, type GameMode } from "./mode";

export const SAVE_VERSION = 1;

export interface SaveHeader {
  version: 1;
  storyBuildId: string;
  language: Language;
  timestamp: string;
  game_mode: GameMode;
  scene?: string;
  pending?: string;
}

export interface SaveFile {
  header: SaveHeader;
  ink: string;
}

export type Decoded =
  | { ok: true; save: SaveFile }
  | { ok: false; reason: "json" | "shape" | "version-old" | "version-new" };

export function encodeSave(save: SaveFile): string {
  return JSON.stringify(save);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Pure; never throws. Unknown header fields are dropped. */
export function decodeSave(raw: string): Decoded {
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "json" };
  }
  if (!isObject(doc) || !isObject(doc.header)) return { ok: false, reason: "shape" };
  const h = doc.header;
  if (typeof h.version !== "number" || !Number.isInteger(h.version)) {
    return { ok: false, reason: "shape" };
  }
  if (h.version < SAVE_VERSION) return { ok: false, reason: "version-old" };
  if (h.version > SAVE_VERSION) return { ok: false, reason: "version-new" };
  const { storyBuildId, language, timestamp, game_mode: mode, scene, pending } = h;
  if (
    typeof doc.ink !== "string" ||
    typeof storyBuildId !== "string" ||
    typeof timestamp !== "string" ||
    typeof language !== "string" ||
    !isLanguage(language) ||
    !isGameMode(mode) ||
    (scene !== undefined && (typeof scene !== "string" || scene === "")) ||
    (pending !== undefined && (typeof pending !== "string" || !ID_PATTERN.test(pending)))
  ) {
    return { ok: false, reason: "shape" };
  }
  const header: SaveHeader = { version: 1, storyBuildId, language, timestamp, game_mode: mode };
  if (scene !== undefined) header.scene = scene;
  if (pending !== undefined) header.pending = pending;
  return { ok: true, save: { header, ink: doc.ink } };
}
