import { readFile, stat } from "node:fs/promises";
import { parseDetailed } from "./parse-detailed-coverage.mjs";
import { parseSummary } from "./parse-summary-coverage.mjs";
import { assertFreshCoverage } from "./coverage-freshness.mjs";

export async function readJsonCoverage(path, relativePath, startedAt, read = readFile, statFile = stat) {
  const before = startedAt ? await statFile(path) : null;
  const parsed = JSON.parse(await read(path, "utf8"));
  const after = startedAt ? await statFile(path) : null;
  assertFreshCoverage(before, after, relativePath, startedAt);
  return relativePath.endsWith("coverage-final.json") || !parsed?.total
    ? parseDetailed(parsed)
    : parseSummary(parsed);
}
