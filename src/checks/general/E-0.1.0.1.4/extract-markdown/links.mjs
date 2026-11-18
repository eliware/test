import collectMarkdownReferenceDefinitions from "./references.mjs";
import extractMarkdownReferenceUses from "./references/extract-markdown-reference-uses.mjs";
import extractInlineMarkdownLinks from "./extract-inline-links.mjs";
import removeMarkdownCode from "./remove-markdown-code.mjs";
const referencePattern = /(?<!!)\[([^\]]+)\](?:\[([^\]]*)\])?/gu;
export default function extractMarkdownLinks(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = collectMarkdownReferenceDefinitions(markdown);
  const links = extractInlineMarkdownLinks(markdown);
  links.push(...extractMarkdownReferenceUses(markdown, definitions, referencePattern));
  return links
    .sort((left, right) => left.index - right.index)
    .map(({ reference }) => ({
      reference,
    }));
}
