const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

function sorted(value) {
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort()));
}

export function validateLockfileDependencies(lockfile, packageJson) {
  const rootPackage = lockfile.packages[""];
  for (const field of dependencyFields) {
    const expected = packageJson?.[field] ?? {};
    const actual = rootPackage[field] ?? {};
    if (sorted(expected) !== sorted(actual)) return `package-lock.json root ${field} must match package.json.`;
  }
  const directDependencies = new Set(dependencyFields.flatMap((field) => Object.keys(packageJson?.[field] ?? {})));
  const missingEntries = [...directDependencies].filter((name) => !Object.hasOwn(lockfile.packages, `node_modules/${name}`));
  if (missingEntries.length > 0) {
    return `package-lock.json must contain an entry for every direct dependency: ${missingEntries.join(", ")}.`;
  }
  return null;
}
