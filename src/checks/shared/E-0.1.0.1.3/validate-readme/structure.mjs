import { removeMarkdownCode } from "../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import { readCanonicalOrder } from "../../../../validation/shared/conventions/read-canonical-order.mjs";
import { validateReadmeHeader } from "./header.mjs";
import { validateReadmeSections } from "./sections.mjs";
import { validateReadmeTocLinks } from "./toc-links.mjs";

export function validateReadmeStructure(readme, expected, packageJson = {}) {
  const lines = readme.split(/\r?\n/u);
  const markdownLines = removeMarkdownCode(readme).split(/\r?\n/u);
  const order = readCanonicalOrder("readme-sections.yaml");
  const headerError = validateReadmeHeader(lines, markdownLines, packageJson, order);
  if (headerError) return headerError;
  const tocIndex = order.headerLines["table-of-contents"];
  const sections = expected.slice(1);
  const sectionResult = validateReadmeSections(
    markdownLines,
    sections,
    order.headerLines["title-and-badges"],
    tocIndex,
  );
  if (sectionResult.error) return sectionResult.error;
  return validateReadmeTocLinks(markdownLines, tocIndex, sections);
}
