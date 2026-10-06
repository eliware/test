import { readdir } from "node:fs/promises";
import { join, sep } from "node:path";

export const specificationEntryLimit = 10_000;
export const specificationDepthLimit = 128;

export async function listSpecificationEntries(root, { list = readdir } = {}) {
  const base = join(root, "specs");
  const pending = [{ path: base, relative: "specs", depth: 0 }];
  const result = [];
  let count = 0;
  while (pending.length) {
    const directory = pending.pop();
    const children = await list(directory.path, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of children) {
      count += 1;
      if (count > specificationEntryLimit)
        throw new Error(`specs/ exceeds ${specificationEntryLimit} entries.`);
      const path = join(directory.path, entry.name);
      const relativePath = join(directory.relative, entry.name).split(sep).join("/");
      if (entry.isDirectory()) {
        const depth = directory.depth + 1;
        if (depth > specificationDepthLimit)
          throw new Error(`specs/ exceeds ${specificationDepthLimit} directory levels.`);
        result.push({ type: "directory", path: relativePath });
        pending.push({ path, relative: relativePath, depth });
      } else {
        result.push({ type: entry.isFile() ? "file" : "unsupported", path: relativePath });
      }
    }
  }
  return result.sort((left, right) => left.path.localeCompare(right.path));
}
