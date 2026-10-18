import semver from "semver";
import { toSemverRange } from "../to-semver-range.mjs";

const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function validateLockfileRootPackage(packageJson, rootPackage, packages) {
  if (rootPackage.name !== packageJson.name || rootPackage.version !== packageJson.version)
    return {
      matches: false,
      errors: ["package-lock.json root package metadata must match package.json."],
    };
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
  const directDependencies = new Set(
    dependencyFields.flatMap((field) =>
      object(packageJson?.[field]) ? Object.keys(packageJson[field]) : [],
    ),
  );
  const missing = [...directDependencies].filter(
    (name) => !Object.hasOwn(packages, `node_modules/${name}`),
  );
  if (missing.length)
    errors.push(`package-lock.json must contain every direct dependency: ${missing.join(", ")}.`);
  for (const field of dependencyFields) {
    const dependencies = packageJson?.[field];
    if (!object(dependencies)) continue;
    for (const [name, range] of Object.entries(dependencies)) {
      const version = packages[`node_modules/${name}`]?.version;
      const semverRange = toSemverRange(range);
      if (!semverRange)
        errors.push(`package.json ${field} has an unsupported dependency range for ${name}.`);
      else if (version && !semver.satisfies(version, semverRange))
        errors.push(`package-lock.json version for ${name} does not satisfy ${range}.`);
    }
  }
  return { matches: true, errors };
}

function sorted(value) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))),
  );
}
