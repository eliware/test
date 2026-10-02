export function assertFreshCoverage(
  before,
  after,
  relativePath,
  startedAt,
  isolatedRunDirectory = false,
) {
  if (
    startedAt &&
    (!after ||
      // codescope ignore: Existing reports at or before run start fail even if rewritten within the same millisecond; isolated runs use unique directories.
      (!isolatedRunDirectory &&
        ((before && before.mtimeMs <= startedAt) || after.mtimeMs <= startedAt)))
  ) {
    throw new Error(`Coverage report is stale or changed: ${relativePath}. Rerun the tests.`);
  }
}
