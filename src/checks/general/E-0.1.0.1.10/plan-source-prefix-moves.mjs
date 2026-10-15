const SOURCE_PREFIX = /^src\//u;

export function planSourcePrefixMoves(files) {
  const paths = new Map(
    files.filter(isSourceModule).map((path) => {
      const normalized = path.replaceAll("\\", "/");
      return [normalized, normalized];
    }),
  );

  for (let pass = 0; pass < paths.size; pass++) {
    const groups = groupByDirectory(paths);
    const changes = [];
    for (const [directory, entries] of groups) {
      const prefixes = repeatedPrefixes(entries);
      const selected = prefixes.filter(
        (entry) =>
          !prefixes.some(
            (candidate) =>
              isRelatedPrefix(candidate.prefix, entry.prefix) &&
              (candidate.count > entry.count ||
                (candidate.count === entry.count && candidate.prefix.length > entry.prefix.length)),
          ),
      );
      for (const { prefix } of selected) {
        for (const entry of entries) {
          if (entry.stem.startsWith(prefix)) {
            changes.push([entry.original, makeTarget(directory, prefix, entry)]);
          }
        }
      }
    }
    if (changes.length === 0) break;
    for (const [original, target] of changes) {
      paths.set(original, target);
    }
  }

  for (const [original, current] of paths) {
    const entry = parsePath(current);
    const parent = entry?.directory.split("/").at(-1);
    if (entry && parent && entry.stem.startsWith(`${parent}-`)) {
      const filename = `${entry.stem.slice(parent.length + 1)}${entry.suffix}`;
      paths.set(original, `${entry.directory}/${filename}`);
    }
  }

  return [...paths]
    .filter(([from, to]) => from !== to)
    .map(([from, to]) => ({ from, to }))
    .sort((left, right) => left.from.localeCompare(right.from));
}

function isSourceModule(path) {
  const normalized = path.replaceAll("\\", "/");
  return SOURCE_PREFIX.test(normalized) && normalized.endsWith(".mjs");
}

function groupByDirectory(paths) {
  const groups = new Map();
  for (const [original, current] of paths) {
    const entry = parsePath(current);
    if (!entry || entry.stem === "E" || entry.stem.startsWith("E-")) continue;
    groups.set(entry.directory, [...(groups.get(entry.directory) ?? []), { ...entry, original }]);
  }
  return groups;
}

function parsePath(path) {
  const normalized = path.replaceAll("\\", "/");
  const separator = normalized.lastIndexOf("/");
  const directory = normalized.slice(0, separator);
  const filename = normalized.slice(separator + 1);
  return {
    path: normalized,
    directory,
    stem: filename.slice(0, -4),
    suffix: ".mjs",
  };
}

function repeatedPrefixes(entries) {
  const counts = new Map();
  for (const { stem } of entries) {
    for (let index = stem.indexOf("-"); index >= 0; index = stem.indexOf("-", index + 1)) {
      const prefix = stem.slice(0, index + 1);
      counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count >= 2)
    .map(([prefix, count]) => ({ prefix, count }));
}

function isRelatedPrefix(left, right) {
  return left.startsWith(right) || right.startsWith(left);
}

function makeTarget(directory, prefix, entry) {
  const folder = prefix.slice(0, -1);
  const file = `${entry.stem.slice(prefix.length)}${entry.suffix}`;
  return [directory, folder, file].filter(Boolean).join("/");
}
