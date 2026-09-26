const directToolNames = new Set(["jest", "oxlint", "prettier"]);

function isDirectToolDependency(name) {
  return directToolNames.has(name) || name.startsWith("@jest/") || name.startsWith("@oxlint/");
}

export function findDirectValidationDependencies(packageJson = {}) {
  const dependencies = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
  return [...dependencies].filter(isDirectToolDependency);
}
