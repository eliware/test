const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function sorted(value) {
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort()));
}

export function validateLockfileDependencies(lockfile, packageJson) {
  if (
    !lockfile.packages ||
    typeof lockfile.packages !== "object" ||
    Array.isArray(lockfile.packages)
  )
    return "package-lock.json packages must be an object.";
  const rootPackage = lockfile.packages[""];
  if (!rootPackage || typeof rootPackage !== "object")
    return "package-lock.json must contain a root packages entry.";
  const failures = [];
  for (const field of dependencyFields) {
    const expected = packageJson?.[field] ?? {};
    const actual = rootPackage[field] ?? {};
    if (sorted(expected) !== sorted(actual))
      failures.push(`package-lock.json root ${field} must match package.json.`);
  }
  const directDependencies = new Set(
    dependencyFields.flatMap((field) => Object.keys(packageJson?.[field] ?? {})),
  );
  const missingEntries = [...directDependencies].filter(
    (name) => !Object.hasOwn(lockfile.packages, `node_modules/${name}`),
  );
  if (missingEntries.length > 0)
    failures.push(
      `package-lock.json must contain an entry for every direct dependency: ${missingEntries.join(", ")}.`,
    );
  const packageError = validatePackageEntries(lockfile.packages);
  if (packageError) failures.push(packageError);
  return failures.length ? failures.join("\n") : null;
}

function validatePackageEntries(packages) {
  const failures = [];
  for (const [path, entry] of Object.entries(packages)) {
    if (path === "") continue;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      failures.push(`package-lock.json entry ${path} must contain a valid package version.`);
      continue;
    }
    if (
      entry.link === true &&
      (typeof entry.resolved !== "string" || entry.resolved.length === 0)
    ) {
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
    for (const field of dependencyFields) {
      if (entry[field] === undefined) continue;
      if (!entry[field] || typeof entry[field] !== "object" || Array.isArray(entry[field]))
        failures.push(`package-lock.json entry ${path} has invalid ${field}.`);
      if (typeof entry[field] !== "object" || Array.isArray(entry[field])) continue;
      for (const dependency of Object.keys(entry[field])) {
        if (
          field === "peerDependencies" &&
          entry.peerDependenciesMeta?.[dependency]?.optional === true
        )
          continue;
        if (!hasPackageEntry(packages, path, dependency))
          failures.push(
            `package-lock.json entry ${path} references missing dependency ${dependency}.`,
          );
      }
    }
  }
  return failures.length ? failures.join("\n") : null;
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
