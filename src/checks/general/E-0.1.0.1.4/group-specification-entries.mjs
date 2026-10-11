import { dirname } from "node:path";

export function groupSpecificationEntries(entries) {
  const filesByDirectory = new Map();
  const childrenByDirectory = new Map();
  for (const entry of entries) {
    const path = entry.path.replaceAll("\\", "/");
    const groups = entry.type === "file" ? filesByDirectory : childrenByDirectory;
    if (entry.type !== "file" && entry.type !== "directory") continue;
    const parent = dirname(path).replaceAll("\\", "/");
    const values = groups.get(parent) ?? [];
    values.push(entry.type === "file" ? entry : path);
    groups.set(parent, values);
  }
  return { filesByDirectory, childrenByDirectory };
}
