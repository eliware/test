import { validateMarkdownLinks } from "./validate-markdown-links.mjs";
import { repositoryFiles } from "./collect-documentation-files.mjs";

export async function validateDocumentationLinks(root, context) {
  return validateMarkdownLinks(
    root,
    await repositoryFiles(root, context?.repositoryInventory),
    context,
  );
}
