import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lockfilesMatch } from "./normalize-lockfile.mjs";
import { regenerateLockfileInWorkspace } from "./regenerate-lockfile-in-workspace.mjs";
import { runNpmProcess } from "./run-npm-process.mjs";
import { selectNpmCommand } from "./select-npm-command.mjs";

export async function regeneratedLockfileMatches(
  packageJson,
  currentLockfile,
  {
    createTemporary = mkdtemp,
    removeTemporary = rm,
    read = readFile,
    write = writeFile,
    getNpmCommand = selectNpmCommand,
    runCommand = runNpmProcess,
  } = {},
) {
  const temporary = await createTemporary(join(tmpdir(), "eliware-test-lock-"));
  try {
    const regenerated = await regenerateLockfileInWorkspace({
      temporary,
      packageJson,
      currentLockfile,
      write,
      read,
      getNpmCommand,
      runCommand,
    });
    return lockfilesMatch(regenerated, currentLockfile);
  } finally {
    await removeTemporary(temporary, { recursive: true, force: true });
  }
}
