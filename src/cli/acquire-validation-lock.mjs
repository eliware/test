import { randomUUID } from "node:crypto";
import { open, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";

export async function acquireValidationLock(root, operations = {}) {
  const lockPath = join(root, "eliware-test.lock");
  const lockId = randomUUID();
  const openFile = operations.open ?? open;
  const readText = operations.readFile ?? readFile;
  const removeFile = operations.unlink ?? unlink;
  let file;
  try {
    file = await openFile(lockPath, "wx");
  } catch (error) {
    if (error.code === "EEXIST") return null;
    throw error;
  }
  try {
    await file.writeFile(
      JSON.stringify({ lockId, pid: process.pid, startedAt: new Date().toISOString() }),
    );
  } catch (error) {
    await file.close();
    await removeFile(lockPath);
    throw error;
  }
  await file.close();
  return async () => {
    try {
      const lock = JSON.parse(await readText(lockPath, "utf8"));
      if (lock.lockId === lockId) await removeFile(lockPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  };
}
