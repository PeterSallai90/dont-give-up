/** One save slot per base path, so develop and pull request previews do not share saves. */
export function saveKey(documentUrl: string): string {
  return `dontgiveup.save.1:${new URL("./", documentUrl).pathname}`;
}
