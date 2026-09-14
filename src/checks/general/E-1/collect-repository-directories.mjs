import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export async function collectRepositoryDirectories(directory, root = directory, readDirectory = readdir) {
  const directories = [];
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(directory, entry.name);
    directories.push(relative(root, path).replaceAll("\\", "/"));
    directories.push(...(await collectRepositoryDirectories(path, root, readDirectory)));
  }
  return directories;
}
