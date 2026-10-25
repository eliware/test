import { randomUUID } from "node:crypto";
import { lstat, open, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";

export async function acquireValidationLock(root, operations = {}) {
  const lockPath = join(root, "eliware-test.lock");
  const lockId = randomUUID();
  const openFile = operations.open ?? open;
  const readText = operations.readFile ?? readFile;
  const removeFile = operations.unlink ?? unlink;
  const readStat = operations.lstat ?? lstat;
  let file;
  try {
    file = await openFile(lockPath, "wx");
  } catch (error) {
    if (error.code === "EEXIST") return null;
    throw error;
  }
  let lockIdentity;
  try {
    await file.writeFile(
      JSON.stringify({ lockId, pid: process.pid, startedAt: new Date().toISOString() }),
    );
    lockIdentity = await file.stat();
  } catch (error) {
    const cleanupErrors = [];
    try {
      await file.close();
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    let lockMayRemain = false;
    try {
      await removeFile(lockPath);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
      lockMayRemain = true;
    }
    if (cleanupErrors.length > 0) {
      const recovery = lockMayRemain
        ? " The unfinished lock can stay at " +
          lockPath +
          ". Remove it after you confirm that no validation run is active."
        : "";
      throw new AggregateError(
        [error, ...cleanupErrors],
        "Could not write lock metadata and cleanup failed." + recovery,
        { cause: error },
      );
    }
    throw error;
  }
  try {
    await file.close();
  } catch (error) {
    try {
      await removeFile(lockPath);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Could not close the validation lock. A stale lock can stay at ${lockPath}.`,
        { cause: error },
      );
    }
    throw error;
  }
  return async () => {
    try {
      const lock = JSON.parse(await readText(lockPath, "utf8"));
      if (lock.lockId !== lockId) return;
      const currentIdentity = await readStat(lockPath);
      if (currentIdentity.dev === lockIdentity.dev && currentIdentity.ino === lockIdentity.ino)
        await removeFile(lockPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  };
}
