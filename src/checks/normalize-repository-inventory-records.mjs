import { relative, resolve, sep, win32 } from "node:path";

export function normalizeRepositoryInventoryRecords(root, records) {
  const windowsRoot = /^(?:[A-Za-z]:[\\/]|\\\\[?.]\\|\\\\|\/\/)/u.test(root);
  const pathApi = windowsRoot ? win32 : { relative, resolve, sep };
  const repositoryRoot = pathApi.resolve(windowsRoot ? normalizeWindowsDevicePath(root) : root);
  return records.flatMap((record) => {
    if (!record || typeof record.path !== "string") return [];
    const recordPath = windowsRoot ? normalizeWindowsDevicePath(record.path) : record.path;
    // codescope ignore: A POSIX-rooted input cannot be contained by a Windows root; Windows UNC paths use backslashes.
    if (windowsRoot && recordPath.startsWith("/")) return [];
    if (windowsRoot && /^[A-Za-z]:(?![\\/])/u.test(recordPath)) return [];
    if (!windowsRoot && /^(?:[A-Za-z]:[\\/]|\\\\)/u.test(recordPath)) return [];
    const path = pathApi
      .relative(repositoryRoot, pathApi.resolve(repositoryRoot, recordPath))
      .split(pathApi.sep)
      .join("/");
    if (path === ".." || path.startsWith("../") || path.includes(":")) return [];
    return [{ ...record, path }];
  });
}

function normalizeWindowsDevicePath(path) {
  // Keep extended volume roots intact; win32 path operations preserve their volume identity.
  return path.replace(/^\\\\[?.]\\UNC\\/iu, "\\\\").replace(/^\\\\[?.]\\(?=[A-Za-z]:[\\/])/u, "");
}
