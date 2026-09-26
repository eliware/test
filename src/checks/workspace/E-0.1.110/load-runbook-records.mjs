import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function collectRunbooks(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(directory, entry.name));
}

export async function loadRunbookRecords(root) {
  const directory = join(root, "runbooks");
  await readFile(join(directory, "README.md"), "utf8");
  const files = await collectRunbooks(directory);
  return { directory, files };
}
