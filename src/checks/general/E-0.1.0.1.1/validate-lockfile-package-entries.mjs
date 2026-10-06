import semver from "semver";

const dependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];

function findDependencyEntry(packages, parent, name) {
  let current = parent;
  while (true) {
    const candidate = `${current}/node_modules/${name}`.replace(/^\//u, "");
    if (Object.hasOwn(packages, candidate)) return candidate;
    const nested = current.lastIndexOf("/node_modules/");
    if (nested < 0)
      return Object.hasOwn(packages, `node_modules/${name}`) ? `node_modules/${name}` : null;
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
        const rawRange = entry[field][name];
        const range = toSemverRange(rawRange);
        if (typeof rawRange !== "string" || !rawRange.trim())
          errors.push(`package-lock.json entry ${path} has an invalid ${field} range for ${name}.`);
        else if (!range)
          errors.push(
            `package-lock.json entry ${path} has an unsupported ${field} range for ${name}.`,
          );
        const targetPath = findDependencyEntry(packages, path, name);
        if (!targetPath && field === "peerDependencies" && isOptionalPeer(entry, name)) continue;
        if (!targetPath)
          errors.push(`package-lock.json entry ${path} references missing dependency ${name}.`);
        else if (
          range &&
          typeof packages[targetPath]?.version === "string" &&
          !semver.satisfies(packages[targetPath].version, range)
        )
          errors.push(
            `package-lock.json entry ${path} dependency ${name} does not satisfy its range.`,
          );
      }
    }
  }
  return errors.length ? errors.join("\n") : null;
}

function toSemverRange(value) {
  if (typeof value !== "string") return null;
  if (semver.validRange(value)) return value;
  const alias = /^npm:(?:@[^/]+\/[^@]+|[^@]+)@(.+)$/u.exec(value);
  return alias && semver.validRange(alias[1]) ? alias[1] : null;
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
