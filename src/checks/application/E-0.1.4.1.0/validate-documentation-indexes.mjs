import { join } from "node:path";
import { readRepositoryText } from "../../../orchestration/read-repository-text.mjs";
import { validateMarkdownIndex } from "./validate-markdown-index.mjs";

export async function validateDocumentationIndexes(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  let paths;
  try {
    paths = await inventory.documentationFiles({
      directory: join(root, "docs"),
      predicate: (name) => /\.md$/iu.test(name),
    });
  } catch {
    return ["docs/README.md and its Markdown index are required."];
  }
  const errors = [];
  if (!paths.includes("README.md")) errors.push("docs/README.md is required.");
  const documents = paths.filter((path) => path !== "README.md");
  let index;
  try {
    index = await readRepositoryText(context, join(root, "docs", "README.md"));
  } catch {
    return [...errors, "docs/README.md is required to index documentation."];
  }
  errors.push(...validateMarkdownIndex(index, documents, "docs/README.md"));
  return errors;
}
