export function validatePackageModuleType(packageJson) {
  return packageJson?.type === "module" ? null : "package.json.type must be module.";
}
