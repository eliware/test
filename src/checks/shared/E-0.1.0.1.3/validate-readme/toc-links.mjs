const referenceDefinition = /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>\r\n]+)>|(\S+))/gimu;
const linkUse = /(?<!!)\[([^\]]+)\](?:\(#([^)]*)\)|\[([^\]]*)\])?/gu;

export function readTocLinks(content) {
  const definitions = new Map();
  for (const [, label, angle, plain] of content.matchAll(referenceDefinition))
    definitions.set(normalizeReferenceLabel(label), angle ?? plain);
  const lines = content
    .split("\n")
    .filter((line) => !/^ {0,3}\[[^\]]+\]:/u.test(line))
    .join("\n");
  const links = [];
  for (const match of lines.matchAll(linkUse)) {
    const [, text, inlineTarget, referenceLabel] = match;
    if (inlineTarget !== undefined) {
      links.push([text, inlineTarget]);
      continue;
    }
    const label = normalizeReferenceLabel(referenceLabel || text);
    const target = definitions.get(label);
    if (target?.startsWith("#")) links.push([text, target.slice(1)]);
  }
  return links;
}

export function validateReadmeTocLinks(markdownLines, tocIndex, expectedSections) {
  const tocEnd = markdownLines.findIndex((line, index) => index > tocIndex && /^##\s+/u.test(line));
  const tocContent = markdownLines.slice(tocIndex, tocEnd).join("\n");
  const expectedLinks = expectedSections.map((heading) => [
    heading,
    heading.toLowerCase().replaceAll(" ", "-"),
  ]);
  const actualLinks = readTocLinks(tocContent);
  return JSON.stringify(actualLinks) === JSON.stringify(expectedLinks)
    ? null
    : "README.md Table of Contents must link each content heading once in order.";
}

function normalizeReferenceLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}
