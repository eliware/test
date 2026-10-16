import { cp, mkdir, rm, symlink, writeFile, chmod, lstat, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { assertSmokePackageParents } from "./assert-smoke-package-parents.mjs";

const defaultFs = { cp, mkdir, rm, symlink, writeFile, chmod, lstat, unlink };

export async function restoreSmokeTargetState(state, fs = defaultFs) {
  if (state?.error) throw new Error(state.error);
  const failures = [];

  for (const entry of [...state.entries].reverse()) {
    try {
      if (state.targetRoot && state.packageName)
        await assertSmokePackageParents(state.targetRoot, state.packageName, fs.lstat);
      await removeCapturedPath(entry.path, fs);
      if (entry.type === "missing") continue;
      await fs.mkdir(dirname(entry.path), { recursive: true });

      if (entry.type === "symlink") await fs.symlink(entry.target, entry.path, entry.linkType);
      if (entry.type === "file") {
        await fs.writeFile(entry.path, entry.data);
        await fs.chmod(entry.path, entry.mode);
      }
      if (entry.type === "directory")
        await fs.cp(entry.backup, entry.path, { recursive: true, verbatimSymlinks: true });
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

async function removeCapturedPath(path, fs) {
  let metadata;
  try {
    metadata = await fs.lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (metadata.isSymbolicLink()) await fs.unlink(path);
  else await fs.rm(path, { recursive: metadata.isDirectory(), force: true });
}
