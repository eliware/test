import extractMarkdownLinks from "../../E-0.1.0.1.4/extract-markdown/links.mjs";
export default function validateMarkdownIndex(content, expectedPaths, indexPath) {
  const links = extractMarkdownLinks(content).map(({ reference }) => reference);
  const actual = links.map((reference) => reference?.replace(/^\.\//u, ""));
  const indexTarget = indexPath.slice(indexPath.lastIndexOf("/") + 1);
  const maintainedPaths = expectedPaths.filter((path) => path !== indexTarget);
  const errors = [];
  for (const path of maintainedPaths)
    if (!actual.includes(path)) errors.push(`${indexPath} must link ${path}.`);
  for (const path of actual)
    if (path === null || !maintainedPaths.includes(path))
      errors.push(`${indexPath} links to unexpected target ${path ?? "a missing target"}.`);
  if (new Set(actual).size !== actual.length)
    errors.push(`${indexPath} must link each target only once.`);
  return errors;
}
