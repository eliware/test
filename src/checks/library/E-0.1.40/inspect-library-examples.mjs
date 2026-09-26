import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateExamplesIndex } from "./validate-examples-index.mjs";

export async function inspectLibraryExamples(root) {
  await readFile(join(root, "docs", "README.md"), "utf8");
  const index = await readFile(join(root, "examples", "README.md"), "utf8");
  const entries = await readdir(join(root, "examples"), { withFileTypes: true });
  const exampleNames = entries.filter(({ name }) => name !== "README.md").map(({ name }) => name);
  const examples = entries.filter((entry) => entry.isFile() && /\.(?:cjs|js|mjs)$/iu.test(entry.name));
  if (examples.length === 0) return { error: "Libraries must provide at least one runnable example." };
  const error = validateExamplesIndex(index, exampleNames);
  return error ? { error } : { examples };
}
