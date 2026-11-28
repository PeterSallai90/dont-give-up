import "./ui/theme.css";
import "./ui/ui.css";
import { GameShell } from "./game/boot";
import { SettingsMenu } from "./game/settings-menu";
import { loadStory, STORY_BUILD_IDS } from "./game/story-source";
import { t } from "./i18n";
import { applyLanguage, resolveLanguage } from "./i18n/document";
import { createLocalStorage } from "./platform/local-storage";
import { saveKey } from "./platform/save-key";
import { mountSettings } from "./ui/settings-panel";
import { mountStartScreen } from "./ui/start-screen";

const root = document.getElementById("ui-root");
if (!root) throw new Error("#ui-root is missing");

let language = resolveLanguage(
  new URLSearchParams(location.search).get("lang"),
  navigator.languages,
);
applyLanguage(language, document);

// Pixi loads after the first screen (ADR 0003). Until the story view (#47) the game screen is a
// placeholder that shows a game is running.
interface Placeholder {
  show(visible: boolean): void;
}
let pixi: Promise<Placeholder> | undefined;
function loadPixi(): Promise<Placeholder> {
  pixi ??= import("pixi.js").then(async ({ Application, Text }) => {
    const app = new Application();
    await app.init({ resizeTo: window, background: "#1b1430", antialias: true });
    document.body.insertBefore(app.canvas, root);
    const title = new Text({
      text: t("app.title"),
      style: { fill: "#ffd166", fontFamily: "Georgia, serif", fontSize: 56, fontWeight: "bold" },
    });
    const subtitle = new Text({
      text: t("app.subtitle"),
      style: { fill: "#f4e9d8", fontFamily: "Georgia, serif", fontSize: 22 },
    });
    title.anchor.set(0.5);
    subtitle.anchor.set(0.5);
    app.stage.addChild(title, subtitle);
    const layout = (): void => {
      title.position.set(app.screen.width / 2, app.screen.height / 2 - 30);
      subtitle.position.set(app.screen.width / 2, app.screen.height / 2 + 30);
    };
    layout();
    app.renderer.on("resize", layout);
    return {
      show(visible: boolean) {
        title.visible = visible;
        subtitle.visible = visible;
      },
    };
  });
  return pixi;
}

let startScreen: { destroy(): void } | undefined;

const shell: GameShell = new GameShell({
  storage: createLocalStorage(),
  key: saveKey(document.URL),
  buildIds: STORY_BUILD_IDS,
  loadStory,
  language: () => language,
  applyLanguage: (lang) => {
    language = lang;
    applyLanguage(lang, document);
  },
  onStart: () => {
    startScreen?.destroy();
    startScreen = mountStartScreen(root, (mode) => shell.pick(mode));
    void loadPixi().then((p) => p.show(false));
    settings.update();
  },
  onGameReady: () => {
    startScreen?.destroy();
    startScreen = undefined;
    void loadPixi().then((p) => p.show(true));
    settings.update();
  },
  onGameDropped: () => {
    void loadPixi().then((p) => p.show(false));
  },
});

const menu = new SettingsMenu({ shell, onChange: () => settings.update() });
const settings = mountSettings(root, menu);

void shell.boot().then(() => {
  void loadPixi();
  settings.update();
});
