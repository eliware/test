import { posix } from "node:path";

export function getRepositoryPathStyle(root, path) {
  const windowsRoot = isWindowsAbsolute(root);
  const windowsPath = isWindowsAbsolute(path);
  const posixRoot = posix.isAbsolute(root);
  const posixPath = posix.isAbsolute(path);
  if ((windowsRoot && posixPath) || (posixRoot && windowsPath)) return null;
  return windowsRoot || windowsPath ? "windows" : "posix";
}

function isWindowsAbsolute(path) {
  return /^[a-z]:[\\/]/iu.test(path) || /^\\\\[^\\/]/u.test(path);
}
