import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export async function collectRepositoryFiles(directory, root = directory, readDirectory = readdir) {
  const files = [];
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectRepositoryFiles(path, root, readDirectory)));
    else if (entry.isFile()) files.push(relative(root, path).replaceAll("\\", "/"));
  }
  return files;
}
