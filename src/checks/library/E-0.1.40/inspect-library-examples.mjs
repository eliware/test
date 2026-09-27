import { readRepositoryText } from "../../read-repository-text.mjs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { validateExamplesIndex } from "./validate-examples-index.mjs";

export async function inspectLibraryExamples(root, context) {
  await readRepositoryText(context, join(root, "docs", "README.md"));
  const index = await readRepositoryText(context, join(root, "examples", "README.md"));
  const entries = context?.repositoryInventory
    ? await context.repositoryInventory.directoryEntries(join(root, "examples"))
    : await readdir(join(root, "examples"), { withFileTypes: true });
  const exampleNames = entries.filter(({ name }) => name !== "README.md").map(({ name }) => name);
  const examples = entries.filter(
    (entry) => entry.isFile() && /\.(?:cjs|js|mjs)$/iu.test(entry.name),
  );
  if (examples.length === 0)
    return { error: "Libraries must provide at least one runnable example." };
  const error = validateExamplesIndex(index, exampleNames);
  return error ? { error } : { examples };
}
