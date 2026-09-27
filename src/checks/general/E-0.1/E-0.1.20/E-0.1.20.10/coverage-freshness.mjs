export function assertFreshCoverage(before, after, relativePath, startedAt, isolatedRunDirectory = false) {
  if (startedAt && (!after || (!isolatedRunDirectory &&
      ((before && before.mtimeMs <= startedAt) || after.mtimeMs <= startedAt)))) {
    throw new Error(`Coverage report is stale or changed: ${relativePath}. Rerun the tests.`);
  }
}
