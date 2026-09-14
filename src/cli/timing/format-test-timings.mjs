import { prepareTestTimings } from "./prepare-test-timings.mjs";

export function formatTestTimings(report, limit = 10) {
  const rows = prepareTestTimings(report, limit);
  if (!rows.length) return "";
  const output = ["Test file timings:"];
  for (const row of rows) {
    output.push(`${(row.duration / 1000).toFixed(3)}s ${row.file}`);
    for (const test of row.tests
      .filter((item) => Number.isFinite(item.duration))
      .sort((left, right) => right.duration - left.duration)) {
      output.push(`  ${(test.duration / 1000).toFixed(3)}s ${test.fullName ?? test.title ?? "unknown test"}`);
    }
  }
  return output.join("\n");
}
