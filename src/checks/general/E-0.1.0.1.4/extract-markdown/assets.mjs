import { removeMarkdownCode } from "./remove-markdown-code.mjs";
import {
  collectMarkdownReferenceDefinitions,
  extractMarkdownReferenceUses,
} from "./references.mjs";

const referencePattern = /!\[([^\]]*)\](?:\[([^\]]*)\])?/gu;

export function extractMarkdownAssets(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = collectMarkdownReferenceDefinitions(markdown);
  const assets = [
    ...markdown.matchAll(
      /!\[[^\]]*\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+[^)]*)?\)|<[a-z][^>]*\bsrc=["']([^"']+)["'][^>]*>/giu,
    ),
  ].map((match) => ({
    index: match.index,
    reference: stripAngleDestination(match[1]) ?? match[2],
  }));
  assets.push(...extractMarkdownReferenceUses(markdown, definitions, referencePattern));
  return assets
    .sort((left, right) => left.index - right.index)
    .map(({ reference }) => ({ reference }));
}

function stripAngleDestination(value) {
  if (!value) return value;
  return value.startsWith("<") ? value.slice(1, -1) : value;
}
