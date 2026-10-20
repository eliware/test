import { mkdtemp, lstat, realpath, rmdir } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";

const tempPrefix = ".eliware-tarball-smoke-";

export async function createSmokeTempRoot(
  root,
  inspect = lstat,
  createTempRoot = mkdtemp,
  remove = rmdir,
  resolvePath = realpath,
) {
  const createdPath = await createTempRoot(join(root, tempPrefix));
  let path;
  try {
    path = resolve(createdPath);
  } catch {
    return { error: "Temporary smoke directory must be a fresh child of the source checkout." };
  }
  if (!isFreshChild(resolve(root), path))
    return { error: "Temporary smoke directory must be a fresh child of the source checkout." };

  try {
    const identity = await inspect(path);
    if (identity.isSymbolicLink())
      return {
        error: `Cannot verify temporary smoke directory. left untrusted path untouched at ${path}.`,
      };
    if (!identity.isDirectory()) throw new Error("temporary path is not a directory");
    const [sourcePath, actualPath] = await Promise.all([resolvePath(root), resolvePath(path)]);
    if (!isFreshChild(sourcePath, actualPath))
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

function isFreshChild(parent, path) {
  const relativePath = relative(parent, path);
  return (
    relativePath !== "" &&
    !relativePath.includes(sep) &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath) &&
    basename(path).startsWith(tempPrefix)
  );
}
