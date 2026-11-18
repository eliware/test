const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export default function validateLockfileRootPackage(packageJson, rootPackage) {
  const errors = [];
  for (const field of dependencyFields) {
    const expected = packageJson?.[field];
    const actual = rootPackage[field];
    if (expected !== undefined && !object(expected)) {
      errors.push(`package.json ${field} must be an object.`);
      continue;
    }
    if (actual !== undefined && !object(actual)) {
      errors.push(`package-lock.json root ${field} must be an object.`);
      continue;
    }
    const expectedMap = expected ?? {};
    const actualMap = actual ?? {};
    for (const [name, range] of Object.entries(expectedMap))
      if (typeof range !== "string" || !range.trim())
        errors.push(`package.json ${field} has an invalid dependency range for ${name}.`);
    for (const [name, range] of Object.entries(actualMap))
      if (typeof range !== "string" || !range.trim())
        errors.push(`package-lock.json root ${field} has an invalid dependency range for ${name}.`);
    if (sorted(expectedMap) !== sorted(actualMap))
      errors.push(`package-lock.json root ${field} must match package.json.`);
  }
  return errors;
}
function sorted(value) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))),
  );
}
