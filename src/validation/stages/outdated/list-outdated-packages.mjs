export function listOutdatedPackages(dependencies, ignoredPackage) {
  return Object.keys(dependencies)
    .filter((name) => name !== ignoredPackage)
    .sort()
    .map((name) => `${name}@latest`);
}
