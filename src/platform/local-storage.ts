import type { KeyValueStorage } from "./storage";

/** Wraps window.localStorage. Errors throw; the save store catches them. */
export function createLocalStorage(): KeyValueStorage {
  return {
    get: (key) => Promise.resolve().then(() => window.localStorage.getItem(key)),
    set: (key, value) => Promise.resolve().then(() => window.localStorage.setItem(key, value)),
    remove: (key) => Promise.resolve().then(() => window.localStorage.removeItem(key)),
  };
}
