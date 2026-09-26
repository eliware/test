import { jsonFiles as collectJsonFiles, repositoryFiles as collectRepositoryFiles } from "./collect-documentation-files.mjs";
import { validateMarkdownLinks as validateLinks } from "./validate-markdown-links.mjs";

export function jsonFiles(root, inventory) {
  return inventory
    ? inventory.documentationFiles({ directory: root, predicate: (name) => name.endsWith(".json") })
    : collectJsonFiles(root);
}
export function repositoryFiles(root, inventory) {
  return inventory
    ? inventory.documentationFiles({ directory: root, predicate: (name) => /\.(?:json|md)$/iu.test(name) })
    : collectRepositoryFiles(root);
}
export function validateMarkdownLinks(root, files, context) { return validateLinks(root, files, context); }
