import { join } from "node:path";
import { readRepositoryText } from "../../../orchestration/read-repository-text.mjs";
import { validateMarkdownIndex } from "./validate-markdown-index.mjs";

export async function validateExamplesIndex(context = {}) {
  const root = context.root ?? process.cwd();
  let files;
  try {
    files = await context.repositoryInventory.files("repository");
  } catch {
    return ["examples/ could not be inspected for JavaScript examples."];
  }
  const examples = files
    .filter((path) => /^examples\/.+\.(?:mjs|js)$/iu.test(path))
    .map((path) => path.slice("examples/".length))
    .sort();
  if (!examples.length) return [];
  let index;
  try {
    index = await readRepositoryText(context, join(root, "examples", "README.md"));
  } catch {
    return ["examples/README.md is required when examples/ contains JavaScript files."];
  }
  const errors = validateMarkdownIndex(index, examples, "examples/README.md");
  return errors;
}
