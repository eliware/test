import { repositoryFiles } from "./collect-documentation-files.mjs";
import { validateMarkdownLinks } from "./validate-markdown-links.mjs";

export async function validateDocumentationLinks(root, context) {
  return validateMarkdownLinks(
    root,
    await repositoryFiles(root, context?.repositoryInventory),
    context,
  );
}
