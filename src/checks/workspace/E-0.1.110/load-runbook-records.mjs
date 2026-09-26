import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";

async function collectRunbooks(directory, inventory) {
  const entries = inventory
    ? await inventory.directoryEntries(directory)
    : await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(directory, entry.name));
}

export async function loadRunbookRecords(root, context) {
  const directory = join(root, "runbooks");
  await readRepositoryText(context, join(directory, "README.md"));
  const files = await collectRunbooks(directory, context?.repositoryInventory);
  return { directory, files };
}
