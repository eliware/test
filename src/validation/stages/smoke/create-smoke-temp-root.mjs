import { mkdtemp, lstat, rmdir } from "node:fs/promises";
import { join } from "node:path";

export async function createSmokeTempRoot(
  root,
  inspect = lstat,
  createTempRoot = mkdtemp,
  remove = rmdir,
) {
  const path = await createTempRoot(join(root, ".eliware-tarball-smoke-"));
  try {
    return { path, identity: await inspect(path) };
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
