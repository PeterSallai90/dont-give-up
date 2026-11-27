import { createHash } from "node:crypto";

/** First 16 hex characters of the SHA-256 of the exact compiled story JSON text. */
export function storyBuildId(compiledJson: string): string {
  return createHash("sha256").update(compiledJson).digest("hex").slice(0, 16);
}
