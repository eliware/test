import { cp, lstat, readFile, readlink, rm, stat } from "node:fs/promises";
import { assertSmokePackageParents } from "../assert-smoke-package-parents.mjs";
import { captureSmokePaths } from "./paths.mjs";

const defaultFs = { cp, lstat, readFile, readlink, rm, stat };

export async function captureSmokeTargetState(
  root,
  packageName,
  binNames = [],
  fs = defaultFs,
  platform = process.platform,
  storage,
) {
  if (typeof storage !== "string" || !storage)
    throw new Error("Smoke state storage must be inside the smoke workspace.");
  try {
    const entries = await captureSmokePaths(
      root,
      packageName,
      binNames,
      storage,
      fs,
      platform,
      (targetRoot, name) => assertSmokePackageParents(targetRoot, name, fs.lstat),
    );
    return { entries, storage, targetRoot: root, packageName };
  } catch (error) {
    try {
      await fs.rm(storage, { recursive: true, force: true });
    } catch (cleanupError) {
      throw new Error(
        `Failed to capture smoke target state (${error.message}). Temporary backup may remain at ${storage}: ${cleanupError.message}`,
        { cause: error },
      );
    }
    throw error;
  }
}
