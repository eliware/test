const definitionPattern = /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>\r\n]+)>|(\S+))/gimu;
export default function collectMarkdownReferenceDefinitions(markdown) {
  const definitions = new Map();
  for (const [, label, angle, plain] of markdown.matchAll(definitionPattern))
    definitions.set(normalizeLabel(label), angle ?? plain);
  return definitions;
}
function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}
