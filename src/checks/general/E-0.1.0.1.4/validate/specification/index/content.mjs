import { extractMarkdownLinks } from "../../../extract-markdown/links.mjs";

export function validateSpecificationIndexContent(content, path, expected) {
  const errors = [];
  if (!isNavigationOnly(content)) errors.push(`${path} must be a navigation-only index.`);
  const actual = extractMarkdownLinks(content).map(({ reference }) => reference);
  for (const target of expected)
    if (!actual.includes(target)) errors.push(`${path} must link ${target}.`);
  for (const target of actual)
    if (!expected.includes(target)) errors.push(`${path} links to unexpected target ${target}.`);
  if (new Set(actual).size !== actual.length)
    errors.push(`${path} must not duplicate index links.`);
  if (actual.length === expected.length && JSON.stringify(actual) !== JSON.stringify(expected))
    errors.push(`${path} must list index links in the required order.`);
  return errors;
}

function isNavigationOnly(content) {
  return content
    .split(/\r?\n/u)
    .every(
      (line) =>
        !line.trim() ||
        /^#{1,6}\s/u.test(line) ||
        /^-\s*\[[^\]]+\](?:\([^)]+\)|\[[^\]]*\])\s*$/u.test(line) ||
        /^ {0,3}\[[^\]]+\]:\s*(?:<[^>]+>|\S+)(?:\s+.*)?$/u.test(line),
    );
}
