import { relative, resolve, sep } from "node:path";

export function normalizeRepositoryInventoryRecords(root, records) {
  const repositoryRoot = resolve(root);
  return records.flatMap((record) => {
    if (!record || typeof record.path !== "string") return [];
    const path = relative(repositoryRoot, resolve(repositoryRoot, record.path))
      .split(sep)
      .join("/");
    if (path === ".." || path.startsWith("../") || path.includes(":")) return [];
    return [{ ...record, path }];
  });
}
