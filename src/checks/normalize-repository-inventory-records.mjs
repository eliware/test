import { relative, resolve, sep, win32 } from "node:path";

export function normalizeRepositoryInventoryRecords(root, records) {
  const windowsRoot = /^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/u.test(root);
  const pathApi = windowsRoot ? win32 : { relative, resolve, sep };
  const repositoryRoot = pathApi.resolve(root);
  return records.flatMap((record) => {
    if (!record || typeof record.path !== "string") return [];
    // codescope ignore: A POSIX-rooted input cannot be contained by a Windows root; Windows UNC paths use backslashes.
    if (windowsRoot && record.path.startsWith("/")) return [];
    if (windowsRoot && /^[A-Za-z]:(?![\\/])/u.test(record.path)) return [];
    if (!windowsRoot && /^(?:[A-Za-z]:[\\/]|\\\\)/u.test(record.path)) return [];
    const path = pathApi
      .relative(repositoryRoot, pathApi.resolve(repositoryRoot, record.path))
      .split(pathApi.sep)
      .join("/");
    if (path === ".." || path.startsWith("../") || path.includes(":")) return [];
    return [{ ...record, path }];
  });
}
