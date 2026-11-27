import { checkStory, formatReport } from "./story-check";

const { problems, stats } = checkStory();
for (const s of stats) {
  const partial = s.partial ? `, coverage partial: ${s.partial}` : "";
  console.log(
    `[${s.lang}] ${s.segments} segments explored, ${s.pruned} pruned, ${s.knotsReached}/${s.knotsTotal} knots reached${partial}`,
  );
}
if (problems.length > 0) {
  console.error(formatReport(problems).join("\n"));
  process.exit(1);
}
console.log(`story OK: ${stats.map((s) => s.lang).join(", ")}`);
