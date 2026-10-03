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
    const rootDependencies = rootPackage[field];
    if (
      rootDependencies !== undefined &&
      (!rootDependencies || typeof rootDependencies !== "object" || Array.isArray(rootDependencies))
    ) {
      failures.push(`package-lock.json root ${field} must be an object.`);
      continue;
    }
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
  const packageError = validateLockfilePackageEntries(lockfile.packages);
  if (packageError) failures.push(packageError);
  return failures.length ? failures.join("\n") : null;
}

import { validateLockfilePackageEntries } from "./validate-lockfile-package-entries.mjs";
