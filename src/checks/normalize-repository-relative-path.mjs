import { posix, win32 } from "node:path";

export function normalizeRepositoryRelativePath(path, root = process.cwd()) {
  if (typeof path !== "string" || path.length === 0) return "unknown";
  if (typeof root !== "string" || root.length === 0) return "[outside repository]";

  const windowsRoot = isWindowsAbsolute(root);
  const windowsPath = isWindowsAbsolute(path);
  const posixRoot = posix.isAbsolute(root);
  const posixPath = posix.isAbsolute(path);
  if ((windowsRoot && posixPath) || (posixRoot && windowsPath)) {
    return "[outside repository]";
  }

  // codescope ignore: relative roots use POSIX joining after Windows separators normalize to '/', which preserves their relative relationship.
  const pathApi = windowsRoot || windowsPath ? win32 : posix;
  const normalizedRoot = pathApi.resolve(root);
  const normalizedPath = pathApi.resolve(normalizedRoot, path.replaceAll("\\", "/"));
  const relativePath = pathApi.relative(normalizedRoot, normalizedPath);
  if (
    relativePath === ".." ||
    /^\.\.[\\/]/u.test(relativePath) ||
    pathApi.isAbsolute(relativePath)
  ) {
    return "[outside repository]";
  }
  return relativePath.replaceAll("\\", "/");
}

function isWindowsAbsolute(path) {
  return /^[a-z]:[\\/]/iu.test(path) || /^\\\\[^\\/]/u.test(path);
}
