export function normalizeLockfile(value) {
  if (Array.isArray(value)) return value.map(normalizeLockfile);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalizeLockfile(child)]),
    );
  }
  return value;
}

export function comparableLockfile(lockfile) {
  return { lockfileVersion: lockfile.lockfileVersion, packages: lockfile.packages };
}

export function lockfilesMatch(left, right) {
  return JSON.stringify(normalizeLockfile(comparableLockfile(left))) ===
    JSON.stringify(normalizeLockfile(comparableLockfile(right)));
}
