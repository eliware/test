export function assertFreshCoverage(before, after, relativePath, startedAt) {
  if (startedAt && ((before && before.mtimeMs < startedAt) || !after || after.mtimeMs < startedAt)) {
    throw new Error(`Coverage report is stale or changed: ${relativePath}. Rerun the tests.`);
  }
}
