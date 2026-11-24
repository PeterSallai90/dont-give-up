import { mkdirSync, writeFileSync } from "node:fs";
import { compileLanguage, storyLanguages } from "./ink";

// Compiles story/<lang>/main.ink to src/generated/story.<lang>.json (gitignored).
const out = "src/generated";
mkdirSync(out, { recursive: true });
let failed = false;
for (const lang of storyLanguages()) {
  const { story, errors, warnings } = compileLanguage(lang);
  for (const w of warnings) console.warn(`[${lang}] warning: ${w}`);
  if (!story || errors.length) {
    for (const e of errors) console.error(`[${lang}] error: ${e}`);
    failed = true;
    continue;
  }
  writeFileSync(`${out}/story.${lang}.json`, story.ToJson() ?? "");
  console.log(`[${lang}] compiled`);
}
process.exit(failed ? 1 : 0);
