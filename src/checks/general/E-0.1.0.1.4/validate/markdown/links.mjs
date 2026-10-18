import { createLocalMarkdownReferenceValidator } from "../../create-local-markdown-reference-validator.mjs";
import { findMarkdownFiles } from "../../find-markdown-files.mjs";
import { validateMarkdownFiles } from "./validate-markdown-files.mjs";

export async function validateMarkdownLinks(root, context = {}, dependencies = {}) {
  const validateLocal = createLocalMarkdownReferenceValidator(root, dependencies);
  let files;
  try {
    files = await (context.repositoryInventory?.documentationFiles?.({
      directory: root,
      predicate: (name) => name.toLowerCase().endsWith(".md"),
    }) ?? findMarkdownFiles(root));
  } catch (error) {
    return [`Markdown files could not be listed: ${error.message}`];
  }
  return validateMarkdownFiles(root, files, validateLocal, dependencies.read);
}
