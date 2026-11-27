import type { Language } from "../i18n";
import type { KeyValueStorage } from "../platform/storage";
import type { GameMode } from "./mode";
import { decodeSave, encodeSave, type SaveFile, type SaveHeader } from "./save-format";

export type SaveWrite = Omit<SaveHeader, "version" | "timestamp" | "storyBuildId"> & {
  ink: string;
};

export class SaveStore {
  private readonly storage: KeyValueStorage;
  private readonly key: string;
  private readonly buildIds: Record<Language, string>;
  private readonly now: () => Date;
  private blocked = false;

  constructor(opts: {
    storage: KeyValueStorage;
    key: string;
    buildIds: Record<Language, string>;
    now?: () => Date;
  }) {
    this.storage = opts.storage;
    this.key = opts.key;
    this.buildIds = opts.buildIds;
    this.now = opts.now ?? (() => new Date());
  }

  /** The valid save of this build, or null on any failure. A newer version blocks writes. */
  async read(): Promise<SaveFile | null> {
    let raw: string | null;
    try {
      raw = await this.storage.get(this.key);
    } catch {
      return null;
    }
    if (raw === null) return null;
    const decoded = decodeSave(raw);
    if (!decoded.ok) {
      if (decoded.reason === "version-new") this.blocked = true;
      return null;
    }
    if (decoded.save.header.storyBuildId !== this.buildIds[decoded.save.header.language]) {
      return null;
    }
    return decoded.save;
  }

  /** Never throws. On a storage failure the slot is removed so no stale save survives. */
  async write(data: SaveWrite): Promise<void> {
    if (this.blocked) return;
    const header: SaveHeader = {
      version: 1,
      storyBuildId: this.buildIds[data.language],
      language: data.language,
      timestamp: this.now().toISOString(),
      game_mode: data.game_mode,
    };
    if (data.scene !== undefined) header.scene = data.scene;
    if (data.pending !== undefined) header.pending = data.pending;
    await this.put(encodeSave({ header, ink: data.ink }));
  }

  private async put(text: string): Promise<void> {
    try {
      await this.storage.set(this.key, text);
    } catch {
      try {
        await this.storage.remove(this.key);
      } catch {
        // storage is unusable; play goes on without a save
      }
    }
  }

  /** New game: removes the slot and lifts the newer-version block. */
  async clear(): Promise<void> {
    this.blocked = false;
    try {
      await this.storage.remove(this.key);
    } catch {
      // nothing to do
    }
  }

  async setMode(mode: GameMode): Promise<boolean> {
    const save = await this.read();
    if (!save || this.blocked) return false;
    try {
      await this.storage.set(
        this.key,
        encodeSave({ header: { ...save.header, game_mode: mode }, ink: save.ink }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
