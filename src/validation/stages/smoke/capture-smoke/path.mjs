import { join } from "node:path";
import { captureSmokeSymlink } from "./symlink.mjs";

export async function captureSmokePath(path, storage, fs, platform) {
  try {
    const info = await fs.lstat(path);
    if (info.isSymbolicLink()) return await captureSmokeSymlink(path, fs, platform);
    if (info.isDirectory()) {
      const backup = join(storage, `${Math.random().toString(16).slice(2)}-directory`);
      await fs.cp(path, backup, { recursive: true, verbatimSymlinks: true });
      return { path, type: "directory", backup };
    }
    if (info.isFile())
      return { path, type: "file", data: await fs.readFile(path), mode: info.mode };
    throw new Error(`Cannot safely preserve unsupported target path: ${path}`);
  } catch (error) {
    if (error.code === "ENOENT") return { path, type: "missing" };
    throw error;
  }
}
