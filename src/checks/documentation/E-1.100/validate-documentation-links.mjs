import { repositoryFiles } from "./collect-documentation-files.mjs";
import { validateMarkdownLinks } from "./validate-markdown-links.mjs";

export async function validateDocumentationLinks(root) {
  return validateMarkdownLinks(root, await repositoryFiles(root));
}
