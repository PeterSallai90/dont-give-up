import { describe, expect, it } from "vitest";
import { createStorageGate } from "../src/game/storage-gate";
import { MemoryStorage, type KeyValueStorage } from "../src/platform/storage";

/** A base whose operations settle only when the test says so. */
class SlowStorage implements KeyValueStorage {
  readonly inner = new MemoryStorage();
  readonly started: string[] = [];
  private readonly waiting: (() => void)[] = [];

  private hold(): Promise<void> {
    return new Promise((resolve) => this.waiting.push(resolve));
  }

  release(): void {
    this.waiting.shift()?.();
  }

  async get(key: string): Promise<string | null> {
    this.started.push("get:" + key);
    await this.hold();
    return this.inner.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    this.started.push("set:" + key);
    await this.hold();
    return this.inner.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.started.push("remove:" + key);
    await this.hold();
    return this.inner.remove(key);
  }
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe("storage gate: before revoke", () => {
  it("forwards get, set and remove to the base", async () => {
    const base = new MemoryStorage();
    const gate = createStorageGate(base);
    expect(gate.revoked).toBe(false);
    await gate.storage.set("k", "v");
    expect(await base.get("k")).toBe("v");
    expect(await gate.storage.get("k")).toBe("v");
    await gate.storage.remove("k");
    expect(await base.get("k")).toBeNull();
  });

  it("runs operations one at a time, first in first out", async () => {
    const base = new SlowStorage();
    const gate = createStorageGate(base);
    const a = gate.storage.set("k", "1");
    const b = gate.storage.set("k", "2");
    const c = gate.storage.get("k");
    await tick();
    expect(base.started).toEqual(["set:k"]);
    base.release();
    await a;
    await tick();
    expect(base.started).toEqual(["set:k", "set:k"]);
    base.release();
    await b;
    await tick();
    expect(base.started).toEqual(["set:k", "set:k", "get:k"]);
    base.release();
    expect(await c).toBe("2");
  });
});

describe("storage gate: after revoke", () => {
  it("get resolves null and set and remove do not reach the base", async () => {
    const base = new MemoryStorage();
    await base.set("k", "kept");
    const gate = createStorageGate(base);
    gate.revoke();
    expect(gate.revoked).toBe(true);
    expect(await gate.storage.get("k")).toBeNull();
    await expect(gate.storage.set("k", "late")).resolves.toBeUndefined();
    await expect(gate.storage.remove("k")).resolves.toBeUndefined();
    expect(await base.get("k")).toBe("kept");
  });

  it("an operation queued before revoke but started after it never reaches the base", async () => {
    const base = new SlowStorage();
    const gate = createStorageGate(base);
    const first = gate.storage.set("k", "in-flight");
    const queuedSet = gate.storage.set("k", "late");
    const queuedRemove = gate.storage.remove("k");
    await tick();
    expect(base.started).toEqual(["set:k"]);
    gate.revoke();
    base.release();
    await Promise.all([first, queuedSet, queuedRemove]);
    await tick();
    expect(base.started).toEqual(["set:k"]);
    expect(await base.inner.get("k")).toBe("in-flight");
  });

  it("revoke is idempotent", () => {
    const gate = createStorageGate(new MemoryStorage());
    gate.revoke();
    gate.revoke();
    expect(gate.revoked).toBe(true);
  });
});
