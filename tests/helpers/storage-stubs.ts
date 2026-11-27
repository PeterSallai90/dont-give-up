import { MemoryStorage, type KeyValueStorage } from "../../src/platform/storage";

export type StorageOp = "get" | "set" | "remove";

/** A MemoryStorage that records every call and can be told to throw on chosen operations. */
export class StubStorage implements KeyValueStorage {
  readonly inner = new MemoryStorage();
  readonly calls: string[] = [];
  readonly failOn = new Set<StorageOp>();

  private async run<T>(op: StorageOp, key: string, body: () => Promise<T>): Promise<T> {
    this.calls.push(`${op}:${key}`);
    if (this.failOn.has(op)) throw new Error(`storage ${op} blocked`);
    return body();
  }

  get(key: string): Promise<string | null> {
    return this.run("get", key, () => this.inner.get(key));
  }

  set(key: string, value: string): Promise<void> {
    return this.run("set", key, () => this.inner.set(key, value));
  }

  remove(key: string): Promise<void> {
    return this.run("remove", key, () => this.inner.remove(key));
  }
}
