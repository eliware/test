export function formatOutdatedDependencies(outdated, ignoredPackage) {
  return Object.keys(outdated ?? {})
    .filter((name) => name !== ignoredPackage)
    .map((name) => `${name}@latest`);
}
