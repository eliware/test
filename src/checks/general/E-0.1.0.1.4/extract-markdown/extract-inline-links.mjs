const pattern =
  /(?<!!)\[[^\]]*\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+[^)]*)?\)|<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>|<((?:https?|mailto):[^ >]+)>/giu;

export function extractInlineMarkdownLinks(markdown) {
  return [...markdown.matchAll(pattern)].map((match) => ({
    index: match.index,
    reference: stripAngleDestination(match[1]) ?? match[2] ?? match[3],
  }));
}

function stripAngleDestination(value) {
  if (!value) return value;
  return value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value;
}
