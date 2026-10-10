import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractMarkdownAssets } from "./extract-markdown-assets.mjs";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { createLocalMarkdownReferenceValidator } from "./create-local-markdown-reference-validator.mjs";
import { findMarkdownFiles } from "./find-markdown-files.mjs";
import { validateExternalLink } from "./validate-external-markdown-link.mjs";

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
  for (const file of files) {
    let text;
    try {
      text = await read(join(root, file), "utf8");
    } catch (error) {
      errors.push(`${file} could not be read: ${error.message}`);
      continue;
    }
    for (const { reference } of [...extractMarkdownLinks(text), ...extractMarkdownAssets(text)]) {
      if (!reference) {
        errors.push(`Markdown reference link has no definition in ${file}.`);
        continue;
      }
      if (/^(?:https?|mailto):/iu.test(reference)) {
        const error = validateExternalLink(reference);
        if (error) errors.push(`${error} in ${file}.`);
        continue;
      }
      if (reference.startsWith("//")) {
        errors.push(`Documentation link is invalid: ${reference} in ${file}.`);
        continue;
      }
      const error = await validateLocal(file, reference);
      if (error) errors.push(error);
    }
  }
  return errors;
}
