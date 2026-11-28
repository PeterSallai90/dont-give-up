import type { KeyValueStorage } from "../platform/storage";

export interface StorageGate {
  readonly storage: KeyValueStorage;
  readonly revoked: boolean;
  revoke(): void;
}

/**
 * Wraps a storage for one game. Operations run one at a time, first in first out. After revoke()
 * nothing reaches the base any more, not even an operation queued earlier: a dropped game can
 * never save, clear or change the mode again.
 */
export function createStorageGate(base: KeyValueStorage): StorageGate {
  let revoked = false;
  let tail: Promise<unknown> = Promise.resolve();

  function enqueue<T>(dropped: T, op: () => Promise<T>): Promise<T> {
    const run = tail.then(() => (revoked ? dropped : op()));
    tail = run.catch(() => undefined);
    return run;
  }

  async function enqueueVoid(op: () => Promise<void>): Promise<void> {
    await enqueue<undefined>(undefined, async () => {
      await op();
      return undefined;
    });
  }

  return {
    storage: {
      get: (key) => enqueue<string | null>(null, () => base.get(key)),
      set: (key, value) => enqueueVoid(() => base.set(key, value)),
      remove: (key) => enqueueVoid(() => base.remove(key)),
    },
    get revoked() {
      return revoked;
    },
    revoke() {
      revoked = true;
    },
  };
}
