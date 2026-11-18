import createMarkdownReferencePolicy from "./references/policy.mjs";
export default function collectMarkdownReferenceDefinitions(markdown) {
  const { definitionPattern, normalizeLabel } = createMarkdownReferencePolicy();
  const definitions = new Map();
  for (const [, label, angle, plain] of markdown.matchAll(definitionPattern))
    definitions.set(normalizeLabel(label), angle ?? plain);
  return definitions;
}
