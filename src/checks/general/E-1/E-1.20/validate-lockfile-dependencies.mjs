const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

function sorted(value) {
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort()));
}

export function validateLockfileDependencies(lockfile, packageJson) {
  if (!lockfile.packages || typeof lockfile.packages !== "object" || Array.isArray(lockfile.packages)) return "package-lock.json packages must be an object.";
  const rootPackage = lockfile.packages[""];
  if (!rootPackage || typeof rootPackage !== "object") return "package-lock.json must contain a root packages entry.";
  for (const field of dependencyFields) {
    const expected = packageJson?.[field] ?? {};
    const actual = rootPackage[field] ?? {};
    if (sorted(expected) !== sorted(actual)) return `package-lock.json root ${field} must match package.json.`;
  }
  const directDependencies = new Set(dependencyFields.flatMap((field) => Object.keys(packageJson?.[field] ?? {})));
  const missingEntries = [...directDependencies].filter((name) => !Object.hasOwn(lockfile.packages, `node_modules/${name}`));
  if (missingEntries.length > 0) {
    return `package-lock.json must contain an entry for every direct dependency: ${missingEntries.join(", ")}.`;
  }
  const packageError = validatePackageEntries(lockfile.packages);
  if (packageError) return packageError;
  return null;
}

function validatePackageEntries(packages) {
  for (const [path, entry] of Object.entries(packages)) {
    if (path === "") continue;
    if (!entry || typeof entry !== "object" || (entry.name !== undefined && (typeof entry.name !== "string" || !entry.name)) || typeof entry.version !== "string" || !entry.version) return `package-lock.json entry ${path} must contain a valid package version.`;
    if (entry.link === true) continue;
    if (typeof entry.resolved !== "string" && typeof entry.integrity !== "string") return `package-lock.json entry ${path} must contain resolved or integrity data.`;
    for (const field of dependencyFields) {
      if (!entry[field]) continue;
      if (typeof entry[field] !== "object" || Array.isArray(entry[field])) return `package-lock.json entry ${path} has invalid ${field}.`;
      for (const dependency of Object.keys(entry[field])) {
        if (field === "peerDependencies" && entry.peerDependenciesMeta?.[dependency]?.optional === true) continue;
        if (!hasPackageEntry(packages, path, dependency)) return `package-lock.json entry ${path} references missing dependency ${dependency}.`;
      }
    }
  }
  return null;
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
