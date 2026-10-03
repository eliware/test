import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function walk(directory, relativeDirectory, files = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) await walk(join(directory, entry.name), path, files);
    else if (entry.isFile() && /\.ya?ml$/iu.test(entry.name)) files.push(path);
  }
  return files;
}

export async function readKnitWorkflowFiles(root, repositoryInventory) {
  if (repositoryInventory)
    return (await repositoryInventory.repositoryFiles()).filter((path) =>
      /^\.knit\/.*\.ya?ml$/iu.test(path),
    );
  return walk(join(root, ".knit"), ".knit");
}
