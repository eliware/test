export function assertFreshCoverage(before, after, relativePath, startedAt) {
  if (startedAt && (!after || after.mtimeMs <= startedAt || before?.mtimeMs === after.mtimeMs)) {
    throw new Error(`Coverage report is stale or changed: ${relativePath}. Rerun the tests.`);
  }
}
