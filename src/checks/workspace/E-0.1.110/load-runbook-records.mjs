import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";

async function collectRunbooks(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(directory, entry.name));
}

export async function loadRunbookRecords(root, context) {
  const directory = join(root, "runbooks");
  await readRepositoryText(context, join(directory, "README.md"));
  const files = await collectRunbooks(directory);
  return { directory, files };
}
