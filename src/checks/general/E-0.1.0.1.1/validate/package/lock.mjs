import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateLockfilePackageEntries } from "../lockfile-package-entries.mjs";
import { validateLockfileRootPackage } from "./root-package.mjs";
import { validateLockfileMetadata } from "./lock-metadata.mjs";

export async function validatePackageLock(root, packageJson, { read = readFile } = {}) {
  let lockfile;
  try {
    lockfile = JSON.parse(await read(join(root, "package-lock.json"), "utf8"));
  } catch {
    return ["package-lock.json must exist and contain valid JSON."];
  }
  const metadata = validateLockfileMetadata(lockfile, packageJson);
  if (metadata.errors.length) return metadata.errors;
  const errors = validateLockfileRootPackage(packageJson, metadata.rootPackage, lockfile.packages);
  const packageErrors = validateLockfilePackageEntries(lockfile.packages);
  if (packageErrors) errors.push(packageErrors);
  return errors;
}
