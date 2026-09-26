import { jsonFiles as collectJsonFiles, repositoryFiles as collectRepositoryFiles } from "./collect-documentation-files.mjs";
import { validateMarkdownLinks as validateLinks } from "./validate-markdown-links.mjs";

export function jsonFiles(root) { return collectJsonFiles(root); }
export function repositoryFiles(root) { return collectRepositoryFiles(root); }
export function validateMarkdownLinks(root, files) { return validateLinks(root, files); }
