import gearSvg from "../assets/ui/settings.svg?raw";
import { t } from "../i18n";
import type { GameMode } from "../game/mode";
import type { SettingsMenu, MenuView } from "../game/settings-menu";
import { el } from "./dom";

const MODES: readonly GameMode[] = ["easy", "normal"];

/** The settings button and its dialog. State lives in SettingsMenu; this only renders it. */
export function mountSettings(
  root: HTMLElement,
  menu: SettingsMenu,
): { update(): void; destroy(): void } {
  const gear = el("button", "settings-button");
  gear.type = "button";
  gear.setAttribute("aria-label", t("settings.open"));
  gear.innerHTML = gearSvg;
  gear.addEventListener("click", () => menu.open());

  const dialog = el("dialog", "settings-dialog");
  dialog.setAttribute("aria-modal", "true");
  // A round listening on window must not see keys typed in the panel.
  for (const type of ["keydown", "keyup", "keypress"]) {
    dialog.addEventListener(type, (e) => e.stopPropagation());
  }
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    menu.close();
  });
  dialog.addEventListener("close", () => menu.close());
  root.append(gear, dialog);

  let rendered: MenuView = "closed";
  let toggles: { mode: GameMode; button: HTMLButtonElement }[] = [];

  function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
    const b = el("button", className, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function heading(text: string): HTMLElement {
    const h = el("h2", "settings-dialog__title", text);
    h.tabIndex = -1;
    return h;
  }

  function buildPanel(): HTMLElement {
    const frag = el("div");
    const header = el("div", "settings-dialog__header");
    const title = heading(t("settings.title"));
    title.id = "settings-title";
    header.append(
      title,
      button(t("settings.close"), "ui-button settings-dialog__close", () => menu.close()),
    );
    const section = el("div", "settings-dialog__section");
    section.append(el("h3", "settings-dialog__subtitle", t("settings.mode.title")));
    const toggle = el("div", "mode-toggle");
    toggle.setAttribute("role", "group");
    toggle.setAttribute("aria-label", t("settings.mode.title"));
    toggles = MODES.map((mode) => {
      const b = button(
        t(mode === "easy" ? "mode.easy.name" : "mode.normal.name"),
        "mode-toggle__option",
        () => menu.setMode(mode),
      );
      toggle.append(b);
      return { mode, button: b };
    });
    section.append(toggle, el("p", "settings-dialog__note", t("mode.change.note")));
    frag.append(header, section);
    if (menu.showNewGame) {
      frag.append(button(t("settings.newgame.button"), "ui-button", () => menu.askNewGame()));
    }
    return frag;
  }

  function buildConfirm(): HTMLElement {
    const frag = el("div");
    const title = heading(t("settings.newgame.confirm.title"));
    title.id = "settings-title";
    const pair = el("div", "button-pair");
    pair.append(
      button(t("settings.newgame.confirm.yes"), "ui-button", () => void menu.confirmNewGame()),
      button(t("settings.newgame.confirm.no"), "ui-button", () => menu.keepPlaying()),
    );
    frag.append(title, el("p", "settings-dialog__body", t("settings.newgame.confirm.body")), pair);
    return frag;
  }

  function update(): void {
    gear.hidden = !menu.available;
    const view = menu.view;
    if (view === "closed") {
      if (dialog.open) dialog.close();
      if (rendered !== "closed") {
        rendered = "closed";
        dialog.replaceChildren();
        if (menu.available) gear.focus();
      }
      return;
    }
    if (view !== rendered) {
      rendered = view;
      dialog.replaceChildren(view === "panel" ? buildPanel() : buildConfirm());
      dialog.setAttribute("aria-labelledby", "settings-title");
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLElement>("#settings-title")?.focus();
    }
    for (const { mode, button: b } of toggles) {
      b.setAttribute("aria-pressed", String(menu.mode === mode));
    }
  }

  update();
  return {
    update,
    destroy: () => {
      if (dialog.open) dialog.close();
      gear.remove();
      dialog.remove();
    },
  };
}
