export function validateSourcePackageIdentity(packageJson) {
  if (typeof packageJson?.name !== "string" || typeof packageJson?.version !== "string")
    return "Source package name and version are required for tarball smoke.";
  return null;
}
