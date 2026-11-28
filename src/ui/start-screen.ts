import { t } from "../i18n";
import type { GameMode } from "../game/mode";
import { el } from "./dom";

const MODES: readonly GameMode[] = ["easy", "normal"];

/** The start screen: two equal mode cards, one tap starts the game. No default, no Start button. */
export function mountStartScreen(
  root: HTMLElement,
  onPick: (mode: GameMode) => Promise<boolean>,
): { destroy(): void } {
  const screen = el("main", "start-screen");
  screen.append(el("h1", "start-screen__title", t("app.title")));
  screen.append(el("h2", "start-screen__heading", t("mode.pick.title")));
  const cards = el("div", "mode-cards");
  const buttons: HTMLButtonElement[] = [];
  for (const mode of MODES) {
    const card = el("button", "mode-card");
    card.type = "button";
    card.append(
      el("span", "mode-card__name", t(mode === "easy" ? "mode.easy.name" : "mode.normal.name")),
      el("span", "mode-card__hint", t(mode === "easy" ? "mode.easy.hint" : "mode.normal.hint")),
    );
    card.addEventListener("click", () => {
      for (const b of buttons) b.disabled = true;
      void onPick(mode)
        .catch(() => false)
        .then((started) => {
          if (!started) for (const b of buttons) b.disabled = false;
        });
    });
    buttons.push(card);
    cards.append(card);
  }
  screen.append(cards, el("p", "start-screen__note", t("mode.pick.note")));
  root.append(screen);
  return { destroy: () => screen.remove() };
}
