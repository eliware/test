import semver from "semver";
import { findLockfileDependencyEntry } from "./find-lockfile-dependency-entry.mjs";
import { toSemverRange } from "./to-semver-range.mjs";
import { isOptionalPeer } from "./optional-peer.mjs";
import { isValidLockfileDependencyName } from "./dependency-name.mjs";
import { resolvePackageOverride } from "./resolve-package-override.mjs";

const dependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];

export function validateLockfilePackageEntries(packages, overrides = {}) {
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
        if (!isValidLockfileDependencyName(name)) {
          errors.push(
            `package-lock.json entry ${path} has an invalid ${field} package name ${name}.`,
          );
          continue;
        }
        const rawRange = entry[field][name];
        const range = toSemverRange(rawRange);
        if (typeof rawRange !== "string" || !rawRange.trim())
          errors.push(`package-lock.json entry ${path} has an invalid ${field} range for ${name}.`);
        else if (!range && !isRegistryTag(rawRange))
          errors.push(
            `package-lock.json entry ${path} has an unsupported ${field} range for ${name}.`,
          );
        const targetPath = findLockfileDependencyEntry(packages, path, name);
        if (!targetPath && field === "peerDependencies" && isOptionalPeer(entry, name)) continue;
        if (!targetPath)
          errors.push(`package-lock.json entry ${path} references missing dependency ${name}.`);
        else {
          const lockedVersion = packages[targetPath]?.version;
          const overrideSpec = resolvePackageOverride(overrides, packageName(path), name);
          const overrideRange = toSemverRange(overrideSpec);
          const satisfiesOverride =
            overrideRange &&
            typeof lockedVersion === "string" &&
            semver.satisfies(lockedVersion, overrideRange);
          if (overrideSpec && overrideRange && !satisfiesOverride)
            errors.push(
              `package-lock.json entry ${targetPath} version does not satisfy root override ${overrideSpec}.`,
            );
          else if (
            range &&
            typeof lockedVersion === "string" &&
            !semver.satisfies(lockedVersion, range) &&
            !satisfiesOverride
          )
            errors.push(
              `package-lock.json entry ${path} dependency ${name} does not satisfy its range.`,
            );
        }
      }
    }
  }
  return errors.length ? errors.join("\n") : null;
}

function packageName(path) {
  const location = path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length);
  if (location.startsWith("@")) return location.split("/").slice(0, 2).join("/");
  return location.split("/")[0];
}

function isRegistryTag(value) {
  return /^[a-z][a-z0-9._-]*$/iu.test(value);
}
