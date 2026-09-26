const pattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)|!?\[[^\]]+\]\[([^\]]+)\]|\b(?:href|src)=["']([^"']+)["']|<((?:https?|mailto):[^ >]+)>/giu;

export function extractMarkdownLinks(content) {
  const definitions = new Map(
    [...content.matchAll(/^\s*\[([^\]]+)\]:\s*(\S+)/gim)].map((entry) => [entry[1].toLowerCase(), entry[2]]),
  );
  return [...content.matchAll(pattern)].map((match) => ({
    reference: match[1] ?? match[3] ?? match[4] ?? definitions.get(match[2]?.toLowerCase()),
    referenceLabel: match[2],
    bareReference: undefined,
  })).filter(({ reference, referenceLabel }) => reference || referenceLabel);
}
