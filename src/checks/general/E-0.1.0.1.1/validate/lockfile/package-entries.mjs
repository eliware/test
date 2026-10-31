import { validateLockfileDependencyReferences } from "./dependency-references.mjs";

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
    errors.push(...validateLockfileDependencyReferences(path, entry, packages, overrides));
  }
  return errors.length ? errors.join("\n") : null;
}
