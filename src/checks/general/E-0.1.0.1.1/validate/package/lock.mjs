import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateLockfilePackageEntries } from "../lockfile-package-entries.mjs";
import { validateLockfileRootPackage } from "./root-package.mjs";
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

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
  const rootValidation = validateLockfileRootPackage(packageJson, rootPackage, lockfile.packages);
  if (!rootValidation.matches) return rootValidation.errors;
  const errors = rootValidation.errors;
  const packageErrors = validateLockfilePackageEntries(lockfile.packages);
  if (packageErrors) errors.push(packageErrors);
  return errors;
}
