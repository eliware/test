import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

export async function readWorkflows(root) {
  const directory = join(root, ".github", "workflows");
  const entries = await readdir(directory, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/i.test(entry.name))
      .map(async (entry) => {
        const content = await readFile(join(directory, entry.name), "utf8");
        return { name: entry.name, content, document: parse(content) };
      }),
  );
}
