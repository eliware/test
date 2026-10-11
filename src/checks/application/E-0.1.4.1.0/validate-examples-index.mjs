import { join } from "node:path";
import { readRepositoryText } from "../../../validation/shared/repository/read-repository-text.mjs";
import { validateMarkdownIndex } from "./validate-markdown-index.mjs";

export async function validateExamplesIndex(context = {}) {
  const root = context.root ?? process.cwd();
  let files;
  try {
    files = await context.repositoryInventory.documentationFiles({
      directory: join(root, "examples"),
      // codescope ignore this because the examples rule defines indexed examples as JavaScript modules.
      predicate: (name) => /\.(?:mjs|js)$/iu.test(name),
      includeGenerated: true,
    });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    return ["examples/ could not be inspected for JavaScript examples."];
  }
  // codescope ignore this because default sort is deterministic and index validation checks membership.
  const examples = files.sort();
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
