import { cp, mkdir, rm, symlink, writeFile, chmod } from "node:fs/promises";
import { dirname } from "node:path";

const defaultFs = { cp, mkdir, rm, symlink, writeFile, chmod };

export async function restoreSmokeTargetState(state, fs = defaultFs) {
  if (state?.error) throw new Error(state.error);
  const failures = [];
  for (const entry of [...state.entries].reverse()) {
    try {
      await fs.rm(entry.path, { recursive: true, force: true });
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
