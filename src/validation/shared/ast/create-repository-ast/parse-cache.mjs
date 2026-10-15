export function createRepositoryAstParseCache(parseSource) {
  const asts = new Map();
  const requests = new Map();

  return function parseCachedSource(key, getSource, options) {
    const request = (requests.get(key) ?? 0) + 1;
    requests.set(key, request);
    return getSource().then((source) => {
      const existing = asts.get(key);
      if (existing?.source === source) return existing.promise;

      const entry = { source, promise: Promise.resolve().then(() => parseSource(source, options)) };
      // Each caller may finish its own snapshot, but stale completions cannot replace a newer cached parse.
      if (requests.get(key) === request || !asts.has(key)) asts.set(key, entry);
      entry.promise.catch(() => {
        if (asts.get(key) === entry) asts.delete(key);
      });
      return entry.promise;
    });
  };
}
