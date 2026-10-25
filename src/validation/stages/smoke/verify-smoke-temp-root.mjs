import { lstat, realpath, rmdir } from "node:fs/promises";
import { resolve } from "node:path";
import { isFreshSmokeTempChild } from "./validate/fresh-temp-root.mjs";

export async function verifySmokeTempRoot(
  root,
  createdPath,
  inspect = lstat,
  remove = rmdir,
  resolvePath = realpath,
) {
  let path;
  try {
    path = resolve(createdPath);
  } catch {
    return { error: "Temporary smoke directory must be a fresh child of the source checkout." };
  }
  if (!isFreshSmokeTempChild(resolve(root), path))
    return { error: "Temporary smoke directory must be a fresh child of the source checkout." };

  try {
    const identity = await inspect(path);
    if (identity.isSymbolicLink())
      return {
        error: `Cannot verify temporary smoke directory. left untrusted path untouched at ${path}.`,
      };
    if (!identity.isDirectory()) throw new Error("temporary path is not a directory");
    const [sourcePath, actualPath] = await Promise.all([resolvePath(root), resolvePath(path)]);
    if (!isFreshSmokeTempChild(sourcePath, actualPath))
      return {
        error: `Cannot verify temporary smoke directory. left untrusted path untouched at ${path}.`,
      };
    return { path, identity };
  } catch (error) {
    try {
      await remove(path);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT")
        return {
          error: `Cannot verify temporary smoke directory. cleanup failed at ${path}: ${cleanupError.message}`,
        };
    }
    return {
      error: `Cannot verify temporary smoke directory. removed empty path ${path}: ${error.message}`,
    };
  }
}
