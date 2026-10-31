import { realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";

export async function resolveFocusedValidationPaths(root, focusedScope) {
  const paths = Array.isArray(focusedScope?.paths)
    ? focusedScope.paths.map((path) =>
        typeof path === "string" ? path.replaceAll("\\", "/") : path,
      )
    : null;
  if (
    !Array.isArray(paths) ||
    paths.length === 0 ||
    !paths.every(isSupportedFocusedPath) ||
    !(await focusedFilesExist(root, paths))
  )
    return null;
  return paths;
}

function isSupportedFocusedPath(path) {
  return (
    typeof path === "string" &&
    /^(?:tests|src)\//iu.test(path) &&
    path.split("/").every((segment) => segment && segment !== "." && segment !== "..")
  );
}

async function focusedFilesExist(root, paths) {
  try {
    const realRoot = await realpath(root);
    for (const path of paths) {
      const realFile = await realpath(join(realRoot, path));
      const fromRoot = relative(realRoot, realFile);
      if (
        fromRoot === "" ||
        fromRoot === ".." ||
        fromRoot.startsWith(`..${sep}`) ||
        isAbsolute(fromRoot)
      )
        return false;
      if (!(await stat(realFile)).isFile()) return false;
    }
    return true;
  } catch {
    return false;
  }
}
