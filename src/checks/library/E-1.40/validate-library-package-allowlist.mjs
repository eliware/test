export function validateLibraryPackageAllowlist(packageJson) {
  return packageJson?.files?.length
    ? null
    : "Libraries must declare a package file allowlist.";
}
