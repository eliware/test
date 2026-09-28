export function selectOutdatedDirectDependencies(packageJson, outdated) {
  const directDependencies = packageJson?.dependencies;
  if (typeof directDependencies !== "object" || directDependencies === null) return {};
  return Object.fromEntries(
    Object.entries(outdated ?? {}).filter(([name]) => Object.hasOwn(directDependencies, name)),
  );
}
