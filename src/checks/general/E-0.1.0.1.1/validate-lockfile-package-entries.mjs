const dependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];

function hasDependencyEntry(packages, parent, name) {
  let current = parent;
  while (true) {
    if (Object.hasOwn(packages, `${current}/node_modules/${name}`.replace(/^\//u, ""))) return true;
    const nested = current.lastIndexOf("/node_modules/");
    if (nested < 0) return Object.hasOwn(packages, `node_modules/${name}`);
    current = current.slice(0, nested);
  }
}

export function validateLockfilePackageEntries(packages) {
  const errors = [];
  for (const [path, entry] of Object.entries(packages)) {
    if (path === "") continue;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`package-lock.json entry ${path} must be an object.`);
      continue;
    }
    if (typeof entry.version !== "string" || !entry.version) {
      errors.push(`package-lock.json entry ${path} must contain a package version.`);
      continue;
    }
    for (const field of dependencyFields) {
      if (entry[field] === undefined) continue;
      if (!entry[field] || typeof entry[field] !== "object" || Array.isArray(entry[field])) {
        errors.push(`package-lock.json entry ${path} has invalid ${field}.`);
        continue;
      }
      for (const name of Object.keys(entry[field])) {
        if (field === "peerDependencies" && isOptionalPeer(entry, name)) continue;
        if (!hasDependencyEntry(packages, path, name))
          errors.push(`package-lock.json entry ${path} references missing dependency ${name}.`);
      }
    }
  }
  return errors.length ? errors.join("\n") : null;
}

function isOptionalPeer(entry, name) {
  const metadata = entry.peerDependenciesMeta;
  const details = metadata?.[name];
  return (
    details !== null &&
    typeof details === "object" &&
    !Array.isArray(details) &&
    details.optional === true
  );
}
