import { Application, Text } from "pixi.js";
import { detectLanguage, isLanguage, setLanguage, t } from "./i18n";

// Placeholder start screen: proves the toolchain (Pixi, i18n, build, preview).
// The real title screen is built through the normal issue flow.
async function start(): Promise<void> {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  setLanguage(isLanguage(fromUrl) ? fromUrl : detectLanguage(navigator.languages));

  const app = new Application();
  await app.init({ resizeTo: window, background: "#1b1430", antialias: true });
  document.body.appendChild(app.canvas);

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
}

void start();
