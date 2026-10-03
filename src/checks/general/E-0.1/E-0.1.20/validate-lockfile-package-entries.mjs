import { validateLockfilePeerDependenciesMeta } from "./validate-lockfile-peer-dependencies-meta.mjs";
import { posix } from "node:path";

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
    if (
      entry.link === true &&
      (typeof entry.resolved !== "string" ||
        !entry.resolved ||
        normalizeLinkTarget(entry.resolved) === null ||
        !Object.hasOwn(packages, normalizeLinkTarget(entry.resolved)))
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
    failures.push(...validateLockfilePeerDependenciesMeta(path, entry));
    validateEntryDependencies(path, entry, packages, failures);
  }
  return failures.length ? failures.join("\n") : null;
}

function validateEntryDependencies(path, entry, packages, failures) {
  const parentPath = entry.link === true ? normalizeLinkTarget(entry.resolved) : path;
  for (const field of dependencyFields) {
    if (entry[field] === undefined) continue;
    if (!entry[field] || typeof entry[field] !== "object" || Array.isArray(entry[field])) {
      failures.push(`package-lock.json entry ${path} has invalid ${field}.`);
      continue;
    }
    for (const dependency of Object.keys(entry[field])) {
      const optionalPeer = field === "peerDependencies" && isOptionalPeer(entry, dependency);
      if (!optionalPeer && !hasPackageEntry(packages, parentPath, dependency))
        failures.push(
          `package-lock.json entry ${path} references missing dependency ${dependency}.`,
        );
    }
  }
}

function isOptionalPeer(entry, dependency) {
  const metadata = entry.peerDependenciesMeta;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const configuration = metadata[dependency];
  return (
    Object.hasOwn(metadata, dependency) &&
    configuration !== null &&
    typeof configuration === "object" &&
    !Array.isArray(configuration) &&
    configuration.optional === true
  );
}

function normalizeLinkTarget(target) {
  const normalized = posix.normalize(target.replaceAll("\\", "/")).replace(/^\.\//u, "");
  return normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/")
    ? null
    : normalized;
}

function hasPackageEntry(packages, parentPath, dependency) {
  // validateLockfilePackageEntries checks every referenced record's shape before the whole lockfile passes.
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
