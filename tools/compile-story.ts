import { mkdirSync, writeFileSync } from "node:fs";
import { storyBuildId } from "./story-build-id";
import { compileLanguage, storyLanguages } from "./ink";

// Compiles story/<lang>/main.ink to src/generated/story.<lang>.json (gitignored).
const out = "src/generated";
mkdirSync(out, { recursive: true });
let failed = false;
const buildIds: Record<string, string> = {};
for (const lang of storyLanguages()) {
  const { story, errors, warnings } = compileLanguage(lang);
  for (const w of warnings) console.warn(`[${lang}] warning: ${w}`);
  if (!story || errors.length) {
    for (const e of errors) console.error(`[${lang}] error: ${e}`);
    failed = true;
    continue;
  }
  const json = story.ToJson() ?? "";
  writeFileSync(`${out}/story.${lang}.json`, json);
  buildIds[lang] = storyBuildId(json);
  console.log(`[${lang}] compiled`);
}
if (!failed) writeFileSync(`${out}/story-build.json`, JSON.stringify(buildIds));
process.exit(failed ? 1 : 0);
