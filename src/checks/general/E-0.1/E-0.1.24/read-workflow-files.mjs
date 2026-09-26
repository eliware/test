import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

export async function readWorkflows(root) {
  const directory = join(root, ".github", "workflows");
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(?:ya?ml)$/iu.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
  return Promise.all(entries.map(async (entry) => ({
    name: entry.name,
    document: parse(await readFile(join(directory, entry.name), "utf8")),
  })));
}
