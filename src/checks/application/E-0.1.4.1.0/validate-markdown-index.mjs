import { extractMarkdownLinks } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";

export function validateMarkdownIndex(content, expectedPaths, indexPath) {
  const links = extractMarkdownLinks(content).map(({ reference }) => reference);
  const actual = links.map((reference) => reference?.replace(/^\.\//u, ""));
  const errors = [];
  for (const path of expectedPaths)
    if (!actual.includes(path)) errors.push(`${indexPath} must link ${path}.`);
  for (const path of actual)
    if (path === null || !expectedPaths.includes(path))
      errors.push(`${indexPath} links to unexpected target ${path ?? "an undefined reference"}.`);
  if (new Set(actual).size !== actual.length)
    errors.push(`${indexPath} must link each target only once.`);
  return errors;
}
