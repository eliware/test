export function formatOutdatedDependencies(outdated) {
  return Object.keys(outdated ?? {}).map((name) => `${name}@latest`);
}
