import { readFile, stat } from "node:fs/promises";
import { parseDetailed } from "./parse-detailed-coverage.mjs";
import { assertFreshCoverage } from "./coverage-freshness.mjs";

export async function readJsonCoverage(path, relativePath, startedAt, read = readFile, statFile = stat, expectedFiles = []) {
  const before = startedAt ? await statFile(path) : null;
  const raw = await read(path, "utf8");
  const parsed = JSON.parse(raw);
  const after = startedAt ? await statFile(path) : null;
  assertFreshCoverage(before, after, relativePath, startedAt);
  if (startedAt && (await read(path, "utf8")) !== raw)
    throw new Error(`Coverage report changed while being read: ${relativePath}. Rerun the tests.`);
  if (relativePath.endsWith("coverage-summary.json")) {
    throw new Error(`Summary-only coverage cannot prove file-level coverage: ${relativePath}.`);
  }
  return parseDetailed(parsed, expectedFiles);
}
