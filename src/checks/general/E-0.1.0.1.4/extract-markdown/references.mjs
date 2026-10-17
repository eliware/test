const definitionPattern = /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>\r\n]+)>|(\S+))/gimu;

export function collectMarkdownReferenceDefinitions(markdown) {
  const definitions = new Map();
  for (const [, label, angle, plain] of markdown.matchAll(definitionPattern))
    definitions.set(normalizeLabel(label), angle ?? plain);
  return definitions;
}

export function extractMarkdownReferenceUses(markdown, definitions, pattern) {
  const referenceText = markdown.replace(definitionPattern, (line) => " ".repeat(line.length));
  const references = [];
  for (const match of referenceText.matchAll(pattern)) {
    if (referenceText[match.index + match[0].length] === "(") continue;
    const label = normalizeLabel(match[2] || match[1]);
    const isReferenceSyntax = match[2] !== undefined || definitions.has(label);
    if (isReferenceSyntax)
      references.push({ index: match.index, reference: definitions.get(label) ?? null });
  }
  return references;
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}
