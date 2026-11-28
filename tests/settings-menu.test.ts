import { describe, expect, it, vi, type Mock } from "vitest";
import { SettingsMenu } from "../src/game/settings-menu";
import { bootedRunning, seedPendingSave, shellRig, stored, storedText } from "./helpers/shell-rig";

function menuFor(r: Awaited<ReturnType<typeof bootedRunning>>): {
  menu: SettingsMenu;
  onPanelOpen: Mock;
  onPanelClose: Mock;
  onChange: Mock;
} {
  const onPanelOpen = vi.fn();
  const onPanelClose = vi.fn();
  const onChange = vi.fn();
  const menu = new SettingsMenu({ shell: r.shell, onPanelOpen, onPanelClose, onChange });
  return { menu, onPanelOpen, onPanelClose, onChange };
}

describe("AC 5 (logic): the panel and the round", () => {
  it("open and close call the pause hooks once each", async () => {
    const r = await bootedRunning("easy");
    const { menu, onPanelOpen, onPanelClose } = menuFor(r);
    expect(menu.view).toBe("closed");
    menu.open();
    expect(menu.view).toBe("panel");
    expect(onPanelOpen).toHaveBeenCalledTimes(1);
    expect(onPanelClose).not.toHaveBeenCalled();
    menu.close();
    expect(menu.view).toBe("closed");
    expect(onPanelClose).toHaveBeenCalledTimes(1);
    expect(onPanelOpen).toHaveBeenCalledTimes(1);
  });

  it("close on a closed menu calls nothing", async () => {
    const r = await bootedRunning("easy");
    const { menu, onPanelClose } = menuFor(r);
    menu.close();
    expect(onPanelClose).not.toHaveBeenCalled();
  });

  it("a mode change inside the panel calls no next, choose or accept and writes only game_mode", async () => {
    const r = await bootedRunning("easy");
    const flow = r.shell.flow;
    if (!flow) throw new Error("no flow");
    await flow.next();
    const before = await stored(r.storage);
    const next = vi.spyOn(flow, "next");
    const choose = vi.spyOn(flow, "choose");
    const accept = vi.spyOn(flow, "accept");
    const { menu } = menuFor(r);
    menu.open();
    menu.setMode("normal");
    expect(menu.mode).toBe("normal");
    expect(menu.view).toBe("panel");
    await vi.waitFor(async () => {
      expect((await stored(r.storage))?.header.game_mode).toBe("normal");
    });
    menu.close();
    expect(next).not.toHaveBeenCalled();
    expect(choose).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
    const after = await stored(r.storage);
    expect(after?.ink).toBe(before?.ink);
    expect({ ...after?.header, game_mode: undefined }).toEqual({
      ...before?.header,
      game_mode: undefined,
    });
    expect(r.shell.flow).toBe(flow);
  });

  it("the panel marks the current mode", async () => {
    const r = await bootedRunning("easy");
    const { menu } = menuFor(r);
    expect(menu.mode).toBe("easy");
    menu.setMode("normal");
    expect(menu.mode).toBe("normal");
  });
});

describe("AC 10: the New game predicate", () => {
  it("false while booting and on the start screen", async () => {
    const r = shellRig();
    const menu = new SettingsMenu({ shell: r.shell });
    expect(menu.available).toBe(false);
    expect(menu.showNewGame).toBe(false);
    await r.shell.boot();
    expect(menu.available).toBe(false);
    expect(menu.showNewGame).toBe(false);
  });

  it("true after a pick with no save yet", async () => {
    const r = await bootedRunning("normal");
    const { menu } = menuFor(r);
    expect(await storedText(r.storage)).toBeNull();
    expect(menu.available).toBe(true);
    expect(menu.showNewGame).toBe(true);
  });

  it("true with failing storage", async () => {
    const r = shellRig();
    r.storage.failOn.add("get");
    r.storage.failOn.add("set");
    r.storage.failOn.add("remove");
    await r.shell.boot();
    await r.shell.pick("easy");
    const menu = new SettingsMenu({ shell: r.shell });
    expect(menu.available).toBe(true);
    expect(menu.showNewGame).toBe(true);
  });

  it("true after a resume", async () => {
    const seed = shellRig();
    await seedPendingSave(seed.storage, "en", "normal");
    const r = shellRig({ storage: seed.storage });
    await r.shell.boot();
    const menu = new SettingsMenu({ shell: r.shell });
    expect(menu.available).toBe(true);
    expect(menu.showNewGame).toBe(true);
  });

  it("false again after newGame", async () => {
    const r = await bootedRunning("normal");
    const { menu } = menuFor(r);
    await r.shell.newGame();
    expect(menu.available).toBe(false);
    expect(menu.showNewGame).toBe(false);
  });
});

describe("AC 11: confirmation", () => {
  it("askNewGame shows the confirmation", async () => {
    const r = await bootedRunning("easy");
    const { menu } = menuFor(r);
    menu.open();
    menu.askNewGame();
    expect(menu.view).toBe("confirm");
  });

  it("Keep playing leaves the save, the flow and the screen untouched", async () => {
    const r = await bootedRunning("easy");
    await r.shell.flow?.next();
    const flow = r.shell.flow;
    const text = await storedText(r.storage);
    const { menu, onPanelClose } = menuFor(r);
    menu.open();
    menu.askNewGame();
    menu.keepPlaying();
    expect(menu.view).toBe("closed");
    expect(onPanelClose).toHaveBeenCalledTimes(1);
    expect(await storedText(r.storage)).toBe(text);
    expect(r.shell.flow).toBe(flow);
    expect(r.shell.state).toBe("running");
  });

  it("close (Escape) from the confirmation leaves everything untouched", async () => {
    const r = await bootedRunning("easy");
    await r.shell.flow?.next();
    const text = await storedText(r.storage);
    const { menu, onPanelClose } = menuFor(r);
    menu.open();
    menu.askNewGame();
    menu.close();
    expect(menu.view).toBe("closed");
    expect(onPanelClose).toHaveBeenCalledTimes(1);
    expect(await storedText(r.storage)).toBe(text);
    expect(r.shell.state).toBe("running");
  });
});

describe("AC 12: confirm", () => {
  it("confirmNewGame closes the panel, clears the slot and shows the start screen", async () => {
    const r = await bootedRunning("easy");
    await r.shell.flow?.next();
    const { menu, onPanelClose } = menuFor(r);
    menu.open();
    menu.askNewGame();
    const starts = r.onStart.mock.calls.length;
    await menu.confirmNewGame();
    expect(menu.view).toBe("closed");
    expect(onPanelClose).toHaveBeenCalledTimes(1);
    expect(await storedText(r.storage)).toBeNull();
    expect(r.onStart.mock.calls.length).toBe(starts + 1);
    expect(r.shell.state).toBe("start");
    expect(menu.mode).toBeUndefined();
  });
});
