import { describe, expect, it } from "vitest";
import { SaveFlow, type SaveFlowDeps } from "../src/game/save-flow";
import { SaveStore } from "../src/game/save-store";
import type { Language } from "../src/i18n";
import { compileInk } from "./helpers/ink-compile";
import { StoryRunner } from "../src/story/runner";
import { StubStorage } from "./helpers/storage-stubs";

const KEY = "dontgiveup.save.1:/dont-give-up/";
const IDS = { en: "en-build-1", hu: "hu-build-1" };
const NOW = new Date("2026-11-27T15:00:00.000Z");

const MAIN_EN = `
VAR mg_fire = ""
VAR mg_patch = ""
-> cold
=== cold ===
{ cold == 1:
    The cold bites. # scene: cabin
}
-> lodge
=== lodge ===
She holds the match. # minigame: fire
{mg_fire == "good": The fire roars.}
{mg_fire == "fair": The fire holds.}
{mg_fire == "poor": The fire sputters.}
-> after
=== after ===
+ [Go back] -> cold
+ [Sleep] -> END
`;

const MAIN_HU = `
VAR mg_fire = ""
VAR mg_patch = ""
-> cold
=== cold ===
{ cold == 1:
    A hideg harap. # scene: cabin
}
-> lodge
=== lodge ===
A nő a gyufát tartja. # minigame: fire
{mg_fire == "good": A tűz lobog.}
{mg_fire == "fair": A tűz tart.}
{mg_fire == "poor": A tűz füstölög.}
-> after
=== after ===
+ [Vissza] -> cold
+ [Alszik] -> END
`;

const CHAIN = `
VAR mg_fire = ""
VAR mg_patch = ""
-> lodge
=== lodge ===
She holds the match. # minigame: fire
{mg_fire == "good": The fire roars.}
She lifts the patch. # minigame: patch
{mg_patch == "good": The roof holds.}
-> END
`;

const SCENES = `
VAR mg_fire = ""
VAR mg_patch = ""
-> a
=== a ===
First. # scene: kitchen
Strike. # minigame: fire
Later. # scene: bunker
Lift. # minigame: patch
{mg_patch == "good": Done.}
-> END
`;

const UNKNOWN_SCENE = `
VAR mg_fire = ""
-> a
=== a ===
Odd place. # scene: no_such_place
Strike. # minigame: fire
-> END
`;

const FIRST_LINE = `
VAR mg_fire = ""
-> k.s
=== k ===
= s
She strikes it. # minigame: fire
Done.
-> END
`;

const NO_FIRE = `
VAR mg_other = ""
Hello.
+ [A] -> END
`;

const BOOM = `
EXTERNAL boom()
VAR mg_fire = ""
-> l
=== l ===
Strike. # minigame: fire
~ boom()
After.
-> END
`;

type Stories = Record<Language, string>;

function stories(en: string): Stories {
  return { en: compileInk(en), hu: compileInk(MAIN_HU) };
}

interface Rig {
  storage: StubStorage;
  deps: SaveFlowDeps;
  loaded: Language[];
}

function rig(s: Stories, storage = new StubStorage(), buildIds = IDS): Rig {
  const loaded: Language[] = [];
  const store = new SaveStore({ storage, key: KEY, buildIds, now: () => NOW });
  return {
    storage,
    loaded,
    deps: {
      store,
      loadStory: (lang) => {
        loaded.push(lang);
        return Promise.resolve(s[lang]);
      },
    },
  };
}

/** A fresh "process" on the same storage: new store, new loader. */
function reboot(from: Rig, s: Stories): Rig {
  return rig(s, from.storage);
}

interface Stored {
  header: Record<string, unknown>;
  ink: string;
}

async function stored(r: Rig): Promise<Stored | null> {
  const raw = await r.storage.inner.get(KEY);
  return raw === null ? null : (JSON.parse(raw) as Stored);
}

async function storedVar(r: Rig, name: string): Promise<unknown> {
  const save = await stored(r);
  const fresh = new StoryRunner(compileInk(MAIN_EN));
  fresh.restore(save?.ink ?? "", "fire");
  return fresh.getVariable(name);
}

const texts = (step: { lines: { text: string }[] }): string[] => step.lines.map((l) => l.text);

async function resumed(
  r: Rig,
): Promise<{ flow: SaveFlow; step: Awaited<ReturnType<SaveFlow["next"]>> }> {
  const boot = await SaveFlow.boot(r.deps);
  if (boot.kind !== "resume") throw new Error("expected a resume");
  return { flow: boot.flow, step: boot.step };
}

async function bootKind(r: Rig): Promise<string> {
  return (await SaveFlow.boot(r.deps)).kind;
}

describe("AC 1: checkpoint at the tag", () => {
  it("the first step carries the lead-in lines, the id and the checkpoint", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    const step = await flow.next();
    expect(texts(step)).toEqual(["The cold bites.", "She holds the match."]);
    expect(step.minigame).toBe("fire");
    expect(typeof step.checkpoint).toBe("string");
  });

  it("a trigger that is the first line of a stitch stops and saves there", async () => {
    const r = rig(stories(FIRST_LINE));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    const step = await flow.next();
    expect(texts(step)).toEqual(["She strikes it."]);
    expect((await stored(r))?.header.pending).toBe("fire");
  });
});

describe("AC 2: written before the round", () => {
  it("the store holds the checkpoint when next() resolves", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "easy");
    const step = await flow.next();
    const save = await stored(r);
    expect(save?.ink).toBe(step.checkpoint);
    expect(save?.header).toMatchObject({
      version: 1,
      storyBuildId: IDS.en,
      language: "en",
      game_mode: "easy",
      pending: "fire",
    });
    expect(r.storage.calls.filter((c) => c.startsWith("set:"))).toHaveLength(1);
  });

  it("nothing from the round is in the checkpoint: the band is still empty", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    expect(await storedVar(r, "mg_fire")).toBe("");
  });
});

describe("AC 3 and 4: force-close, kill or reload mid-round", () => {
  it("resumes at the same trigger with no lines, no choices and the same id", async () => {
    const r1 = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    const first = await flow.next();
    const { step } = await resumed(reboot(r1, stories(MAIN_EN)));
    expect(step.lines).toEqual([]);
    expect(step.choices).toEqual([]);
    expect(step.ended).toBe(false);
    expect(step.minigame).toBe(first.minigame);
    expect(step.checkpoint).toBe(first.checkpoint);
  });

  it("a resumed flow can finish the round and carries on from the checkpoint", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const { flow } = await resumed(reboot(r1, stories(MAIN_EN)));
    const after = await flow.accept("fair");
    expect(texts(after)).toEqual(["The fire holds."]);
    expect(after.choices.map((c) => c.text)).toEqual(["Go back", "Sleep"]);
  });

  it("no save at all gives the start screen", async () => {
    expect(await bootKind(rig(stories(MAIN_EN)))).toBe("start");
  });

  it("a second kill during the resumed round resumes again from the same checkpoint", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const r2 = reboot(r1, stories(MAIN_EN));
    const a = await resumed(r2);
    const b = await resumed(reboot(r2, stories(MAIN_EN)));
    expect(b.step.checkpoint).toBe(a.step.checkpoint);
  });
});

describe("AC 5: restart, not retry; AC 15: no text", () => {
  it("the resumed step has only the StoryStep fields and no retry field", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const { step } = await resumed(reboot(r1, stories(MAIN_EN)));
    const allowed = ["lines", "choices", "ended", "minigame", "checkpoint"];
    expect(Object.keys(step).every((k) => allowed.includes(k))).toBe(true);
    expect(step.lines).toEqual([]);
  });
});

describe("AC 6: band written only on accept", () => {
  it("after a resume mg_<id> is still empty and the story cannot advance until accept", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const { flow } = await resumed(reboot(r1, stories(MAIN_EN)));
    await expect(flow.next()).rejects.toThrow();
    expect(await storedVar(r1, "mg_fire")).toBe("");
  });

  it("the band chosen after the resume is what the story reads", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const { flow } = await resumed(reboot(r1, stories(MAIN_EN)));
    expect(texts(await flow.accept("poor"))).toEqual(["The fire sputters."]);
  });
});

describe("AC 7: once-only beats do not replay after a resume", () => {
  it("the cold knot's first-visit text is not shown again after resume, accept and going back", async () => {
    const r1 = rig(stories(MAIN_EN));
    const flow1 = await SaveFlow.newGame(r1.deps, "en", "normal");
    expect(texts(await flow1.next())).toContain("The cold bites.");
    const { flow } = await resumed(reboot(r1, stories(MAIN_EN)));
    await flow.accept("good");
    flow.choose(0);
    const again = await flow.next();
    expect(texts(again)).not.toContain("The cold bites.");
    expect(again.minigame).toBe("fire");
  });
});

describe("AC 8: accepted band", () => {
  it("(a) the next trigger's checkpoint replaces the old one before it is shown", async () => {
    const r = rig(stories(CHAIN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    const first = await flow.next();
    const second = await flow.accept("good");
    expect(second.minigame).toBe("patch");
    const save = await stored(r);
    expect(save?.header.pending).toBe("patch");
    expect(save?.ink).toBe(second.checkpoint);
    expect(save?.ink).not.toBe(first.checkpoint);
  });

  it("(a) a reload after that resumes at the second trigger, never the finished one", async () => {
    const r1 = rig(stories(CHAIN));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    await flow.accept("good");
    const { step } = await resumed(reboot(r1, stories(CHAIN)));
    expect(step.minigame).toBe("patch");
  });

  it("(b) the next stop is a choice: the old checkpoint is deleted and a reload shows the start screen", async () => {
    const r1 = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    const after = await flow.accept("good");
    expect(after.choices.length).toBe(2);
    expect(await stored(r1)).toBeNull();
    expect(await bootKind(reboot(r1, stories(MAIN_EN)))).toBe("start");
  });

  it("(b) the same when the story ends right after the band", async () => {
    const r1 = rig(stories(FIRST_LINE));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    const after = await flow.accept("poor");
    expect(after.ended).toBe(true);
    expect(await stored(r1)).toBeNull();
  });
});

describe("AC 9: corrupted save", () => {
  function save(ink: string): string {
    return JSON.stringify({
      header: {
        version: 1,
        storyBuildId: IDS.en,
        language: "en",
        timestamp: NOW.toISOString(),
        game_mode: "normal",
        pending: "fire",
      },
      ink,
    });
  }

  async function bootWith(
    raw: string,
    s: Stories = stories(MAIN_EN),
  ): Promise<{ kind: string; r: Rig }> {
    const r = rig(s);
    await r.storage.inner.set(KEY, raw);
    return { kind: await bootKind(r), r };
  }

  it("bad JSON, truncated data and a missing header give the start screen", async () => {
    const good = save("{}");
    for (const raw of ["{nope", good.slice(0, 40), JSON.stringify({ ink: "{}" })]) {
      expect((await bootWith(raw)).kind).toBe("start");
    }
  });

  it("an ink state that fails to load gives the start screen and the store is unchanged", async () => {
    const raw = save("{}");
    const { kind, r } = await bootWith(raw);
    expect(kind).toBe("start");
    expect(await r.storage.inner.get(KEY)).toBe(raw);
  });

  it("an ink state of garbage text gives the start screen", async () => {
    expect((await bootWith(save("not ink at all"))).kind).toBe("start");
  });

  it("a pending id the story has no variable for fails the probe and gives the start screen", async () => {
    const donor = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(donor.deps, "en", "normal");
    const step = await flow.next();
    const raw = save(step.checkpoint ?? "");
    const { kind, r } = await bootWith(raw, stories(NO_FIRE));
    expect(kind).toBe("start");
    expect(await r.storage.inner.get(KEY)).toBe(raw);
  });

  it("Continue() throwing right after load gives the start screen", async () => {
    const r1 = rig(stories(BOOM));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    expect(await bootKind(reboot(r1, stories(BOOM)))).toBe("start");
  });

  it("a story that cannot be loaded gives the start screen", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    const broken: SaveFlowDeps = {
      store: r.deps.store,
      loadStory: () => Promise.reject(new Error("offline")),
    };
    expect((await SaveFlow.boot(broken)).kind).toBe("start");
  });
});

describe("AC 10: version", () => {
  async function savedWith(version: number): Promise<Rig> {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    const doc = (await stored(r)) as Stored;
    doc.header.version = version;
    await r.storage.inner.set(KEY, JSON.stringify(doc));
    return reboot(r, stories(MAIN_EN));
  }

  it("version 0 and version 2 give the start screen", async () => {
    expect(await bootKind(await savedWith(0))).toBe("start");
    expect(await bootKind(await savedWith(2))).toBe("start");
  });

  it("a newer save is not overwritten by a write, but a new game replaces it", async () => {
    const r = await savedWith(2);
    const before = await r.storage.inner.get(KEY);
    expect(await bootKind(r)).toBe("start");
    await r.deps.store.write({ language: "en", game_mode: "normal", ink: "{}", pending: "fire" });
    expect(await r.storage.inner.get(KEY)).toBe(before);
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    expect((await stored(r))?.header.version).toBe(1);
  });
});

describe("AC 11: story changed", () => {
  it("a different build id for the language gives the start screen", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const changed = rig(stories(MAIN_EN), r1.storage, { en: "en-build-2", hu: IDS.hu });
    expect(await bootKind(changed)).toBe("start");
  });
});

describe("AC 12: language from the save", () => {
  it("a Hungarian save resumes in Hungarian and only the Hungarian story is loaded", async () => {
    const r1 = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r1.deps, "hu", "normal");
    await flow.next();
    const r2 = reboot(r1, stories(MAIN_EN));
    const { flow: back } = await resumed(r2);
    expect(back.language).toBe("hu");
    expect(r2.loaded.every((l) => l === "hu")).toBe(true);
    expect(texts(await back.accept("good"))).toEqual(["A tűz lobog."]);
  });

  it("an English save stays English", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const { flow } = await resumed(reboot(r1, stories(MAIN_EN)));
    expect(flow.language).toBe("en");
  });
});

describe("AC 13: mode", () => {
  it("setMode mid-round, then a kill, resumes with the new mode", async () => {
    const r1 = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    expect(flow.mode).toBe("normal");
    await flow.next();
    await flow.setMode("easy");
    expect(flow.mode).toBe("easy");
    const { flow: back } = await resumed(reboot(r1, stories(MAIN_EN)));
    expect(back.mode).toBe("easy");
  });

  it("the new game's mode goes into the first save", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "easy");
    await flow.next();
    expect((await stored(r))?.header.game_mode).toBe("easy");
  });

  it("setMode keeps the checkpoint and pending id", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    const step = await flow.next();
    await flow.setMode("easy");
    const save = await stored(r);
    expect(save?.ink).toBe(step.checkpoint);
    expect(save?.header.pending).toBe("fire");
  });
});

describe("AC 14: storage failure", () => {
  it("play continues when set throws on the first trigger", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    r.storage.failOn.add("set");
    const step = await flow.next();
    expect(step.minigame).toBe("fire");
    expect(texts(await flow.accept("good"))).toEqual(["The fire roars."]);
  });

  it("a failed write on accept leaves no save, so the finished minigame never replays", async () => {
    const r1 = rig(stories(CHAIN));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    r1.storage.failOn.add("set");
    const second = await flow.accept("good");
    expect(second.minigame).toBe("patch");
    r1.storage.failOn.delete("set");
    expect(await stored(r1)).toBeNull();
    expect(await bootKind(reboot(r1, stories(CHAIN)))).toBe("start");
  });

  it("blocked get, set and remove never throw out of newGame, boot or setMode", async () => {
    const r = rig(stories(MAIN_EN));
    r.storage.failOn.add("get").add("set").add("remove");
    expect(await bootKind(r)).toBe("start");
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await expect(flow.next()).resolves.toBeDefined();
    await flow.setMode("easy");
    expect(flow.mode).toBe("easy");
  });
});

describe("AC 16: scene", () => {
  it("the save holds the last scene tag of the lines shown", async () => {
    const r = rig(stories(SCENES));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    expect(flow.scene).toBe("kitchen");
    expect((await stored(r))?.header.scene).toBe("kitchen");
  });

  it("the scene is restored on resume", async () => {
    const r1 = rig(stories(SCENES));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    const { flow } = await resumed(reboot(r1, stories(SCENES)));
    expect(flow.scene).toBe("kitchen");
  });

  it("after an accepted band the next checkpoint carries the new scene", async () => {
    const r = rig(stories(SCENES));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    await flow.accept("good");
    expect(flow.scene).toBe("bunker");
    expect((await stored(r))?.header.scene).toBe("bunker");
  });

  it("no scene tag gives no scene in the header", async () => {
    const r = rig(stories(CHAIN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    expect(flow.scene).toBeUndefined();
    expect((await stored(r))?.header.scene).toBeUndefined();
  });

  it("an unknown scene id is saved and is no error", async () => {
    const r1 = rig(stories(UNKNOWN_SCENE));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    expect((await stored(r1))?.header.scene).toBe("no_such_place");
    expect(await bootKind(reboot(r1, stories(UNKNOWN_SCENE)))).toBe("resume");
  });
});

describe("AC 17: band survives a save", () => {
  it("saveNow right after accept holds the band in the ink state", async () => {
    const r = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r.deps, "en", "normal");
    await flow.next();
    await flow.accept("good");
    await flow.saveNow();
    expect(await storedVar(r, "mg_fire")).toBe("good");
  });

  it("saveNow at the trigger keeps the pending id and the resume works", async () => {
    const r1 = rig(stories(MAIN_EN));
    const flow = await SaveFlow.newGame(r1.deps, "en", "normal");
    await flow.next();
    await flow.saveNow();
    expect((await stored(r1))?.header.pending).toBe("fire");
    expect(await bootKind(reboot(r1, stories(MAIN_EN)))).toBe("resume");
  });
});

describe("new game", () => {
  it("clears the old save", async () => {
    const r1 = rig(stories(MAIN_EN));
    await (await SaveFlow.newGame(r1.deps, "en", "normal")).next();
    expect(await stored(r1)).not.toBeNull();
    await SaveFlow.newGame(reboot(r1, stories(MAIN_EN)).deps, "hu", "easy");
    expect(await stored(r1)).toBeNull();
  });
});
