import { readFile } from "node:fs/promises";
import { join } from "node:path";
import semver from "semver";
import { validateLockfilePackageEntries } from "./validate-lockfile-package-entries.mjs";

const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function sorted(value) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))),
  );
}

export async function validatePackageLock(root, packageJson, { read = readFile } = {}) {
  let lockfile;
  try {
    lockfile = JSON.parse(await read(join(root, "package-lock.json"), "utf8"));
  } catch {
    return ["package-lock.json must exist and contain valid JSON."];
  }
  if (!object(lockfile)) return ["package-lock.json must contain a JSON object."];
  if (lockfile.name !== packageJson?.name || lockfile.version !== packageJson?.version)
    return ["package-lock.json name and version must match package.json."];
  if (lockfile.lockfileVersion !== 3) return ["package-lock.json must use lockfile version 3."];
  if (!object(lockfile.packages) || !object(lockfile.packages[""]))
    return ["package-lock.json must contain a packages object and root entry."];
  const rootPackage = lockfile.packages[""];
  if (rootPackage.name !== packageJson.name || rootPackage.version !== packageJson.version)
    return ["package-lock.json root package metadata must match package.json."];
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
    (name) => !Object.hasOwn(lockfile.packages, `node_modules/${name}`),
  );
  if (missing.length)
    errors.push(`package-lock.json must contain every direct dependency: ${missing.join(", ")}.`);
  for (const field of dependencyFields) {
    const dependencies = packageJson?.[field];
    if (!object(dependencies)) continue;
    for (const [name, range] of Object.entries(dependencies)) {
      const version = lockfile.packages[`node_modules/${name}`]?.version;
      const semverRange = toSemverRange(range);
      if (!semverRange)
        errors.push(`package.json ${field} has an unsupported dependency range for ${name}.`);
      else if (version && !semver.satisfies(version, semverRange))
        errors.push(`package-lock.json version for ${name} does not satisfy ${range}.`);
    }
  }
  const packageErrors = validateLockfilePackageEntries(lockfile.packages);
  if (packageErrors) errors.push(packageErrors);
  return errors;
}

function toSemverRange(value) {
  if (typeof value !== "string") return null;
  if (semver.validRange(value)) return value;
  const alias = /^npm:(?:@[^/]+\/[^@]+|[^@]+)@(.+)$/u.exec(value);
  return alias && semver.validRange(alias[1]) ? alias[1] : null;
}
