import {
  collectMarkdownReferenceDefinitions,
  extractMarkdownReferenceUses,
} from "./references.mjs";
import { removeMarkdownCode } from "./remove-markdown-code.mjs";

const pattern =
  /(?<!!)\[[^\]]*\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+[^)]*)?\)|<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>|<((?:https?|mailto):[^ >]+)>/giu;
const referencePattern = /(?<!!)\[([^\]]+)\](?:\[([^\]]*)\])?/gu;

export function extractMarkdownLinks(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = collectMarkdownReferenceDefinitions(markdown);
  const links = [...markdown.matchAll(pattern)].map((match) => ({
    index: match.index,
    reference: stripAngleDestination(match[1]) ?? match[2] ?? match[3],
  }));
  links.push(...extractMarkdownReferenceUses(markdown, definitions, referencePattern));
  return links
    .sort((left, right) => left.index - right.index)
    .map(({ reference }) => ({ reference }));
}

function stripAngleDestination(value) {
  if (!value) return value;
  return value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value;
}
