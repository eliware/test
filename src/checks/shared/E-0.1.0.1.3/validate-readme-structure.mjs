import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

export function validateReadmeStructure(readme, expected, packageJson = {}) {
  const lines = readme.split(/\r?\n/u);
  const markdownLines = removeMarkdownCode(readme).split(/\r?\n/u);
  const order = readCanonicalOrder("readme-sections.yaml");
  const headerIndexes = order.header.map((name) => order.headerLines[name]);
  const tocIndex = order.headerLines["table-of-contents"];
  const headerOrderIsValid = headerIndexes.every(
    (index, position) => position === 0 || index === headerIndexes[position - 1] + 2,
  );
  if (lines[0] !== brand) return "README.md must begin with the exact Eliware logo header.";
  const title = (lines[headerIndexes[1]] ?? "").replace(
    /(?:\s+\[!\[[^\]]+\]\([^)]+\)\]\([^)]+\))+$/u,
    "",
  );
  if (title !== packageJson?.name) return "README.md title must match package.json.name.";
  if (
    !headerOrderIsValid ||
    headerIndexes.slice(1).some((index) => lines[index - 1] !== "") ||
    lines[headerIndexes[2]] !== packageJson?.description ||
    markdownLines[tocIndex] !== `## ${expected[0]}`
  )
    return "README.md must order its logo, title, description, and Table of Contents with blank lines.";
  const actual = markdownLines
    .filter((line) => /^##\s+/u.test(line))
    .map((line) => line.slice(3).trim());
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    return "README.md headings must match the required order without duplicates or extras.";
  const tocEnd = markdownLines.findIndex((line, index) => index > tocIndex && /^##\s+/u.test(line));
  const tocContent = markdownLines.slice(tocIndex, tocEnd).join("\n");
  const links = [...tocContent.matchAll(/(?<!!)\[([^\]]+)\]\(#([^)]+)\)/gu)];
  const expectedLinks = expected
    .slice(1)
    .map((heading) => [heading, heading.toLowerCase().replaceAll(" ", "-")]);
  const actualLinks = links.map((match) => [match[1], match[2]]);
  return JSON.stringify(actualLinks) === JSON.stringify(expectedLinks)
    ? null
    : "README.md Table of Contents must link each content heading once in order.";
}
