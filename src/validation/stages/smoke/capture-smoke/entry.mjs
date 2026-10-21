import { captureSmokeDirectory } from "./directory.mjs";
import { captureSmokeFile } from "./file.mjs";
import { captureSmokeSymlink } from "./symlink.mjs";

export async function captureSmokePath(path, storage, fs, platform) {
  try {
    const info = await fs.lstat(path);
    if (info.isSymbolicLink()) return await captureSmokeSymlink(path, fs, platform);
    if (info.isDirectory()) return await captureSmokeDirectory(path, storage, fs);
    if (info.isFile()) return await captureSmokeFile(path, info, fs);
    throw new Error(`Cannot safely preserve unsupported target path: ${path}`);
  } catch (error) {
    if (error.code === "ENOENT") return { path, type: "missing" };
    throw error;
  }
}
