import { removeMarkdownCode } from "../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import { readCanonicalOrder } from "../../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateReadmeCompositionOrder(readme, expected) {
  const order = readCanonicalOrder("readme-sections.yaml");
  const headings = removeMarkdownCode(readme)
    .split(/\r?\n/u)
    .filter((line) => /^##\s+/u.test(line))
    .map((line) => line.slice(3).trim());
  const actual = headings.slice(2);
  const selected = expected.slice(1);
  return actual.length === selected.length && isSameOrder(actual, selected)
    ? null
    : `README.md sections must use the complete order from ${order.tableOfContentsHeading}.`;
}

function isSameOrder(actual, expected) {
  return actual.every((heading, index) => heading === expected[index]);
}
