export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Map-backed storage for Node tests and as a fallback. */
export class MemoryStorage implements KeyValueStorage {
  private readonly map = new Map<string, string>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.map.get(key) ?? null);
  }

  set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    this.map.delete(key);
    return Promise.resolve();
  }
}
