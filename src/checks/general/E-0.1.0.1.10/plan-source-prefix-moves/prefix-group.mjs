export default function repeatedPrefixes(entries) {
  const counts = new Map();
  for (const { stem } of entries) {
    for (let index = stem.indexOf("-"); index >= 0; index = stem.indexOf("-", index + 1)) {
      const prefix = stem.slice(0, index + 1);
      counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count >= 2)
    .map(([prefix, count]) => ({
      prefix,
      count,
    }));
}
