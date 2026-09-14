export function validateLockfileShape(lockfile, packageJson) {
  if (lockfile.name !== packageJson?.name || lockfile.version !== packageJson?.version) {
    return "package-lock.json name and version must match package.json.";
  }
  if (lockfile.lockfileVersion !== 3) return "package-lock.json must use lockfile version 3 (lockfileVersion 3).";
  const rootPackage = lockfile.packages?.[""];
  if (!rootPackage || rootPackage.name !== packageJson?.name || rootPackage.version !== packageJson?.version) {
    return "package-lock.json root package metadata must match package.json.";
  }
  return null;
}
