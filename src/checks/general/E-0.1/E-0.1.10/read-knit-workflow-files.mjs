import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function walk(directory, relativeDirectory, readDirectory) {
  const files = [];
  const entries = await readDirectory(directory, { withFileTypes: true });
  const pending = [{ directory, relativeDirectory, entries, index: 0 }];
  while (pending.length > 0) {
    const current = pending.at(-1);
    if (current.index >= current.entries.length) {
      pending.pop();
      continue;
    }
    const entry = current.entries[current.index++];
    const path = `${current.relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) {
      const childDirectory = join(current.directory, entry.name);
      const childEntries = await readDirectory(childDirectory, { withFileTypes: true });
      pending.push({
        directory: childDirectory,
        relativeDirectory: path,
        entries: childEntries,
        index: 0,
      });
    } else if (entry.isFile() && /\.ya?ml$/iu.test(entry.name)) files.push(path);
  }
  return files;
}

export async function readKnitWorkflowFiles(root, repositoryInventory, readDirectory = readdir) {
  if (repositoryInventory)
    return (await repositoryInventory.repositoryFiles()).filter((path) =>
      /^\.knit\/.*\.ya?ml$/iu.test(path),
    );
  return walk(join(root, ".knit"), ".knit", readDirectory);
}
