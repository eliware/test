import createMarkdownReferencePolicy from "./policy.mjs";
function extractMarkdownReferenceUses(markdown, definitions, pattern) {
  const { definitionPattern, normalizeLabel } = createMarkdownReferencePolicy();
  const referenceText = markdown.replace(definitionPattern, (line) => " ".repeat(line.length));
  const references = [];
  for (const match of referenceText.matchAll(pattern)) {
    if (referenceText[match.index + match[0].length] === "(") continue;
    const label = normalizeLabel(match[2] || match[1]);
    const isReferenceSyntax = match[2] !== undefined || definitions.has(label);
    if (isReferenceSyntax)
      references.push({
        index: match.index,
        reference: definitions.get(label) ?? null,
      });
  }
  return references;
}
export default extractMarkdownReferenceUses;
