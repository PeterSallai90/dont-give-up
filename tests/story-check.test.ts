import { describe, expect, it } from "vitest";
import { checkStory, formatReport } from "../tools/story-check";

describe("checkStory on the real story", () => {
  it("returns no problems for both languages within the default limit", () => {
    const report = checkStory();
    expect(report.problems).toEqual([]);
    expect(report.stats.map((s) => s.lang).sort()).toEqual(["en", "hu"]);
    for (const s of report.stats) expect(s.partial).toBe(false);
  });
});

describe("AC 6: formatReport", () => {
  const many = (n: number): string[] => Array.from({ length: n }, (_, i) => `[en] problem ${i}`);

  it("prints at most 20 problems and then 'and N more'", () => {
    const out = formatReport(many(25));
    expect(out).toHaveLength(21);
    expect(out[20]).toBe("and 5 more");
  });

  it("prints all problems when there are 20 or fewer", () => {
    expect(formatReport(many(20))).toEqual(many(20));
    expect(formatReport(many(3))).toEqual(many(3));
  });
});
