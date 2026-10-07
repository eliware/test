import { dirname } from "node:path";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createRepositoryEntryIndex(records) {
  const childrenByDirectory = new Map();
  const knownDirectories = new Set();
  const prunedDirectories = new Set();
  for (const record of records) {
    const parent = dirname(record.path).replaceAll("\\", "/");
    const children = childrenByDirectory.get(parent) ?? [];
    children.push(record);
    childrenByDirectory.set(parent, children);
    if (record.type === "directory") {
      knownDirectories.add(record.path);
      if (generatedPath.test(record.path)) prunedDirectories.add(record.path);
    }
  }
  return { childrenByDirectory, knownDirectories, prunedDirectories };
}
