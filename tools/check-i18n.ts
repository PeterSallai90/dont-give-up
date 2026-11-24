import { readdirSync, readFileSync } from "node:fs";

// Every UI string table must have exactly the keys of en.json, each with non-empty text.
const dir = "src/i18n";
const load = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(`${dir}/${file}`, "utf8")) as Record<string, unknown>;
const en = load("en.json");
const enKeys = Object.keys(en);
const problems: string[] = [];
const keyPattern = /^[a-z0-9]+(\.[a-z0-9_]+)+$/;
for (const key of enKeys) {
  if (!keyPattern.test(key))
    problems.push(`en.json: key "${key}" is not dotted lower-case (area.subject[.detail])`);
}
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const table = load(file);
  for (const key of enKeys) {
    const value = table[key];
    if (typeof value !== "string" || value.trim() === "")
      problems.push(`${file}: missing or empty "${key}"`);
  }
  for (const key of Object.keys(table)) {
    if (!(key in en)) problems.push(`${file}: "${key}" is not in en.json`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`i18n OK: ${enKeys.length} keys in every language`);
