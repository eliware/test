const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function validateLockfileMetadata(lockfile, packageJson) {
  if (!isObject(lockfile)) return { errors: ["package-lock.json must contain a JSON object."] };
  if (lockfile.name !== packageJson?.name || lockfile.version !== packageJson?.version)
    return { errors: ["package-lock.json name and version must match package.json."] };
  if (lockfile.lockfileVersion !== 3)
    return { errors: ["package-lock.json must use lockfile version 3."] };
  if (!isObject(lockfile.packages) || !isObject(lockfile.packages[""]))
    return { errors: ["package-lock.json must contain a packages object and root entry."] };
  const rootPackage = lockfile.packages[""];
  if (rootPackage.name !== packageJson?.name || rootPackage.version !== packageJson?.version)
    return { errors: ["package-lock.json root package metadata must match package.json."] };
  return { errors: [], rootPackage };
}
