import { removeMarkdownCode } from "../E-0.1.0.1.4/extract-markdown-links.mjs";

const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

export function validateReadmeStructure(readme, expected, packageJson = {}) {
  const lines = readme.split(/\r?\n/u);
  const markdownLines = removeMarkdownCode(readme).split(/\r?\n/u);
  if (lines[0] !== brand) return "README.md must begin with the exact Eliware logo header.";
  const toc = expected[0];
  const tocIndex = markdownLines.findIndex((line) => line === `## ${toc}`);
  if (tocIndex < 0) return "README.md must include Table of Contents after its title.";
  const titleLines = lines.slice(1, tocIndex).filter((line) => line.trim());
  if (titleLines.length !== 1) return "README.md must place its title before Table of Contents.";
  const title = titleLines[0].replace(/(?:\s+\[!\[[^\]]+\]\([^)]+\)\]\([^)]+\))+$/u, "");
  if (title !== packageJson?.name) return "README.md title must match package.json.name.";
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
