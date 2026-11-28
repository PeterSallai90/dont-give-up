import { vi } from "vitest";
import { GameShell, type ShellDeps } from "../../src/game/boot";
import { SaveFlow } from "../../src/game/save-flow";
import { SaveStore } from "../../src/game/save-store";
import type { Language } from "../../src/i18n";
import { compileInk } from "./ink-compile";
import { StubStorage } from "./storage-stubs";

export const KEY = "dontgiveup.save.1:/dont-give-up/";
export const IDS = { en: "en-build-1", hu: "hu-build-1" };
const NOW = new Date("2026-11-28T10:00:00.000Z");

const MAIN_EN = `
VAR mg_fire = ""
-> cold
=== cold ===
The cold bites. # scene: cabin
She holds the match. # minigame: fire
{mg_fire == "good": The fire roars.}
-> after
=== after ===
+ [Go back] -> cold
+ [Sleep] -> END
`;

const MAIN_HU = `
VAR mg_fire = ""
-> cold
=== cold ===
A hideg harap. # scene: cabin
A nő a gyufát tartja. # minigame: fire
{mg_fire == "good": A tűz lobog.}
-> after
=== after ===
+ [Vissza] -> cold
+ [Alszik] -> END
`;

export const STORIES: Record<Language, string> = {
  en: compileInk(MAIN_EN),
  hu: compileInk(MAIN_HU),
};

export interface ShellRig {
  storage: StubStorage;
  shell: GameShell;
  loaded: Language[];
  events: string[];
  onStart: ReturnType<typeof vi.fn>;
  onGameReady: ReturnType<typeof vi.fn>;
  onGameDropped: ReturnType<typeof vi.fn>;
  applyLanguage: ReturnType<typeof vi.fn>;
  loadFails: { count: number };
}

export function shellRig(
  opts: { storage?: StubStorage; language?: Language; buildIds?: Record<Language, string> } = {},
): ShellRig {
  const storage = opts.storage ?? new StubStorage();
  const loaded: Language[] = [];
  const events: string[] = [];
  const loadFails = { count: 0 };
  const onStart = vi.fn(() => events.push("start"));
  const onGameReady = vi.fn(() => events.push("ready"));
  const onGameDropped = vi.fn();
  const applyLanguage = vi.fn(() => events.push("language"));
  const deps: ShellDeps = {
    storage,
    key: KEY,
    buildIds: opts.buildIds ?? IDS,
    loadStory: (lang) => {
      loaded.push(lang);
      if (loadFails.count > 0) {
        loadFails.count -= 1;
        return Promise.reject(new Error("story load failed"));
      }
      return Promise.resolve(STORIES[lang]);
    },
    language: () => opts.language ?? "en",
    applyLanguage,
    onStart,
    onGameReady,
    onGameDropped,
    now: () => NOW,
  };
  return {
    storage,
    shell: new GameShell(deps),
    loaded,
    events,
    onStart,
    onGameReady,
    onGameDropped,
    applyLanguage,
    loadFails,
  };
}

/** Writes a valid pending save (stopped at the fire minigame) straight into the storage. */
export async function seedPendingSave(
  storage: StubStorage,
  language: Language,
  mode: "easy" | "normal",
  buildIds: Record<Language, string> = IDS,
): Promise<void> {
  const store = new SaveStore({ storage, key: KEY, buildIds, now: () => NOW });
  const flow = await SaveFlow.newGame(
    { store, loadStory: (l) => Promise.resolve(STORIES[l]) },
    language,
    mode,
  );
  await flow.next();
}

export interface Stored {
  header: Record<string, unknown>;
  ink: string;
}

export async function storedText(storage: StubStorage): Promise<string | null> {
  return storage.inner.get(KEY);
}

export async function stored(storage: StubStorage): Promise<Stored | null> {
  const raw = await storage.inner.get(KEY);
  return raw === null ? null : (JSON.parse(raw) as Stored);
}

export async function bootedRunning(
  mode: "easy" | "normal" = "normal",
  language: Language = "en",
): Promise<ShellRig> {
  const rig = shellRig({ language });
  await rig.shell.boot();
  await rig.shell.pick(mode);
  return rig;
}
