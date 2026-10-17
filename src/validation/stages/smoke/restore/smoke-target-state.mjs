import { cp, mkdir, rm, symlink, writeFile, chmod, lstat, unlink } from "node:fs/promises";
import { assertSmokePackageParents } from "../assert-smoke-package-parents.mjs";
import { restoreCapturedSmokePath } from "./captured-smoke-path.mjs";

const defaultFs = { cp, mkdir, rm, symlink, writeFile, chmod, lstat, unlink };

export async function restoreSmokeTargetState(state, fs = defaultFs) {
  if (state?.error) throw new Error(state.error);
  const failures = [];

  for (const entry of [...state.entries].reverse()) {
    try {
      if (state.targetRoot && state.packageName)
        await assertSmokePackageParents(state.targetRoot, state.packageName, fs.lstat);
      await restoreCapturedSmokePath(entry, fs);
    } catch (error) {
      failures.push(`${entry.path}: ${error.message}`);
    }
  }
  if (failures.length)
    throw new Error(
      `Could not fully restore smoke target: ${failures.join("; ")}. Backups remain at ${state.storage}.`,
    );
  await fs.rm(state.storage, { recursive: true, force: true });
}
