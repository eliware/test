import { lstat, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

export async function prepareConsumerCoverageDirectory(root, fs = {}) {
  const makeDirectory = fs.mkdir ?? mkdir;
  const inspectPath = fs.lstat ?? lstat;
  const readEntries = fs.readdir ?? readdir;
  const removePath = fs.rm ?? rm;
  const directory = join(root, "coverage");

  try {
    const info = await inspectPath(directory);
    if (info.isSymbolicLink()) throw new Error("coverage must not be a symbolic link.");
    if (!info.isDirectory()) throw new Error("coverage must be a directory.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await makeDirectory(directory, { recursive: true });
    return directory;
  }

  for (const entry of await readEntries(directory)) {
    if (entry === "eliware-test.log") continue;
    await removePath(join(directory, entry), { recursive: true, force: true });
  }

  return directory;
}
