import { extractMarkdownLinks } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";

export function validateMarkdownIndex(content, expectedPaths, indexPath) {
  const links = extractMarkdownLinks(content).map(({ reference }) => reference);
  const errors = [];
  for (const path of expectedPaths)
    if (!links.includes(path) && !links.includes(`./${path}`))
      errors.push(`${indexPath} must link ${path}.`);
  return errors;
}
