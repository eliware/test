import { basename } from "node:path";

export function validateRunbookIndexCoverage(files, indexedPaths) {
  const unindexed = files.filter((file) => !indexedPaths.has(file));
  return unindexed.length > 0
    ? `Runbook records must be indexed: ${unindexed.map((file) => basename(file)).join(", ")}.`
    : null;
}
