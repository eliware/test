import { readFile } from "node:fs/promises";
import { createLocalMarkdownReferenceValidator } from "../../create-local-markdown-reference-validator.mjs";
import { findMarkdownFiles } from "../../find-markdown-files.mjs";
import { validateMarkdownDocument } from "./document.mjs";

export async function validateMarkdownLinks(root, context = {}, dependencies = {}) {
  const read = dependencies.read ?? readFile;
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
  const errors = [];
  for (const file of files)
    errors.push(...(await validateMarkdownDocument(root, file, validateLocal, read)));
  return errors;
}
