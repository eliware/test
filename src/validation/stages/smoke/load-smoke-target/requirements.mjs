export function hasPackageDependency(targetPackage, packageName) {
  return ["dependencies", "devDependencies", "optionalDependencies"].some((field) =>
    Object.hasOwn(targetPackage[field] ?? {}, packageName),
  );
}

export function validateSmokeTargetRequirements(targetPackage, packageName) {
  if (targetPackage?.name === packageName)
    return "Smoke target must not be the source package repository.";
  if (!targetPackage?.scripts?.test) return "Smoke target must define an npm test script.";
  if (!hasPackageDependency(targetPackage, packageName))
    return `Smoke target must list ${packageName} in package.json dependencies.`;
  return null;
}
