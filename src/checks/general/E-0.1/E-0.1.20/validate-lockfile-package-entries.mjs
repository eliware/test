const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export function validateLockfilePackageEntries(packages) {
  const failures = [];
  for (const [path, entry] of Object.entries(packages)) {
    if (path === "") continue;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      failures.push(`package-lock.json entry ${path} must contain a valid package version.`);
      continue;
    }
    if (entry.link === true && (typeof entry.resolved !== "string" || !entry.resolved)) {
      failures.push(`package-lock.json link entry ${path} must contain a valid resolved target.`);
      continue;
    }
    if (
      (entry.name !== undefined && (typeof entry.name !== "string" || !entry.name)) ||
      (entry.link !== true && (typeof entry.version !== "string" || !entry.version))
    ) {
      failures.push(`package-lock.json entry ${path} must contain a valid package version.`);
      continue;
    }
    validateEntryDependencies(path, entry, packages, failures);
  }
  return failures.length ? failures.join("\n") : null;
}

function validateEntryDependencies(path, entry, packages, failures) {
  for (const field of dependencyFields) {
    if (entry[field] === undefined) continue;
    if (!entry[field] || typeof entry[field] !== "object" || Array.isArray(entry[field])) {
      failures.push(`package-lock.json entry ${path} has invalid ${field}.`);
      continue;
    }
    for (const dependency of Object.keys(entry[field])) {
      const optionalPeer =
        field === "peerDependencies" && entry.peerDependenciesMeta?.[dependency]?.optional === true;
      if (!optionalPeer && !hasPackageEntry(packages, path, dependency))
        failures.push(
          `package-lock.json entry ${path} references missing dependency ${dependency}.`,
        );
    }
  }
}

function hasPackageEntry(packages, parentPath, dependency) {
  let current = parentPath;
  while (true) {
    const candidate = `${current}/node_modules/${dependency}`.replace(/^\//u, "");
    if (Object.hasOwn(packages, candidate)) return true;
    const next = current.lastIndexOf("/node_modules/");
    if (next < 0) break;
    current = current.slice(0, next);
  }
  return Object.hasOwn(packages, `node_modules/${dependency}`);
}
