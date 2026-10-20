import { appendFileSync, lstatSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function createTimingLog(root, startedAt, fileSystem = {}) {
  const append = fileSystem.append ?? appendFileSync;
  const inspect = fileSystem.lstat ?? lstatSync;
  const mkdir = fileSystem.mkdir ?? mkdirSync;
  const replace = fileSystem.replace ?? writeFileSync;
  const path = join(root, "coverage", "eliware-test.log");
  const directory = dirname(path);
  try {
    const info = inspect(directory);
    if (info.isSymbolicLink() || !info.isDirectory())
      throw new Error("coverage must be a real directory.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    mkdir(directory, { recursive: true });
    const created = inspect(directory);
    if (created.isSymbolicLink() || !created.isDirectory())
      throw new Error("coverage must be a real directory.");
  }
  try {
    const info = inspect(path);
    if (info.isSymbolicLink() || !info.isFile())
      throw new Error("coverage/eliware-test.log must be a regular file.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  replace(path, `Started: ${new Date(startedAt).toISOString()}\n`, "utf8");
  return (text) => append(path, text, "utf8");
}
