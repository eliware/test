import { removeMarkdownCode } from "./extract-markdown-links.mjs";

export function extractMarkdownAssets(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = new Map();
  for (const [, label, angle, plain] of markdown.matchAll(
    /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>\r\n]+)>|(\S+))/gimu,
  ))
    definitions.set(normalizeLabel(label), angle ?? plain);
  const assets = [
    ...markdown.matchAll(
      /!\[[^\]]*\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+[^)]*)?\)|<[a-z][^>]*\bsrc=["']([^"']+)["'][^>]*>/giu,
    ),
  ].map((match) => ({
    index: match.index,
    reference: stripAngleDestination(match[1]) ?? match[2],
  }));
  const referenceText = markdown.replace(/^ {0,3}\[[^\]]+\]:[^\r\n]*/gimu, (line) =>
    " ".repeat(line.length),
  );
  for (const match of referenceText.matchAll(/!\[([^\]]*)\](?:\[([^\]]*)\])?/gu)) {
    if (referenceText[match.index + match[0].length] === "(") continue;
    const label = normalizeLabel(match[2] || match[1]);
    const isReferenceSyntax = match[2] !== undefined || definitions.has(label);
    if (isReferenceSyntax)
      assets.push({ index: match.index, reference: definitions.get(label) ?? null });
  }
  return assets
    .sort((left, right) => left.index - right.index)
    .map(({ reference }) => ({ reference }));
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

function stripAngleDestination(value) {
  if (!value) return value;
  return value.startsWith("<") ? value.slice(1, -1) : value;
}
