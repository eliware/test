import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

export function readWorkflows(root, repositoryInventory) {
  return loadWorkflows(root, repositoryInventory);
}

async function loadWorkflows(root, repositoryInventory) {
  const directory = join(root, ".github", "workflows");
  const entries = (
    repositoryInventory
      ? await repositoryInventory.directoryEntries(directory)
      : await readdir(directory, { withFileTypes: true })
  )
    .filter((entry) => entry.isFile() && /\.(?:ya?ml)$/iu.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
  return Promise.all(
    entries.map(async (entry) => {
      const file = join(directory, entry.name);
      const document = repositoryInventory
        ? await repositoryInventory.readParsed(file, "yaml-document", parse)
        : parse(await readFile(file, "utf8"));
      return { name: entry.name, document };
    }),
  );
}
