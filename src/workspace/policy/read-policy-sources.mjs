const MAX_SOURCE_READERS = 6;

/** Read discovered policy sources with bounded concurrency and stable ordering. */
export async function readPolicySources(sourceFiles, readSource, inspect) {
  const results = Array.from({ length: sourceFiles.length });
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < sourceFiles.length) {
      const index = nextIndex++;
      const { root, path } = sourceFiles[index];
      results[index] = await inspect(root, path, await readSource(path, 'utf8'));
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_SOURCE_READERS, sourceFiles.length) }, worker));
  return results.filter(Boolean);
}
