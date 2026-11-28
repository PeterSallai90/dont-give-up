import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const NEW_LOGIC = [
  "src/game/storage-gate.ts",
  "src/game/mode-source.ts",
  "src/game/boot.ts",
  "src/game/settings-menu.ts",
  "src/i18n/document.ts",
];

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:])\/\/.*$/gmu, "$1");
}

function logicFiles(): string[] {
  return ["src/game", "src/i18n"].flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => join(dir, f).replace(/\\/gu, "/")),
  );
}

describe("AC 20: logic stays out of the rendering layer", () => {
  it("the new logic modules exist", () => {
    for (const f of NEW_LOGIC) expect(existsSync(f), f).toBe(true);
  });

  it("src/game and src/i18n import neither pixi.js nor src/ui", () => {
    for (const f of logicFiles()) {
      const code = stripComments(readFileSync(f, "utf8"));
      expect(code, f).not.toMatch(/from\s+["']pixi\.js["']/u);
      expect(code, f).not.toMatch(/from\s+["'](?:\.\.?\/)+ui(?:\/[^"']*)?["']/u);
      expect(code, f).not.toMatch(/import\(\s*["']pixi\.js["']\s*\)/u);
    }
  });

  it("src/game and src/i18n use no document or window global", () => {
    for (const f of logicFiles()) {
      const code = stripComments(readFileSync(f, "utf8"));
      expect(code, f).not.toMatch(/\b(?:document|window|localStorage)\s*[.[]/u);
      expect(code, f).not.toMatch(/\btypeof\s+(?:document|window)\b/u);
    }
  });
});
