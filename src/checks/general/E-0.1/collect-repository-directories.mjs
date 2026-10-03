import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export async function collectRepositoryDirectories(
  directory,
  root = directory,
  readDirectory = readdir,
) {
  const directories = [];
  const pending = [
    { directory, entries: await readDirectory(directory, { withFileTypes: true }), index: 0 },
  ];
  while (pending.length > 0) {
    const current = pending.at(-1);
    if (current.index >= current.entries.length) {
      pending.pop();
      continue;
    }
    const entry = current.entries[current.index++];
    if (!entry.isDirectory()) continue;
    const path = join(current.directory, entry.name);
    directories.push(relative(root, path).replaceAll("\\", "/"));
    pending.push({
      directory: path,
      entries: await readDirectory(path, { withFileTypes: true }),
      index: 0,
    });
  }
  return directories;
}
