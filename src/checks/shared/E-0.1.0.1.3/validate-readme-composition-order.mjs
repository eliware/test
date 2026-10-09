import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateReadmeCompositionOrder(readme, expected) {
  const order = readCanonicalOrder("readme-sections.yaml");
  const profileSections = new Set([
    ...Object.values(order.profileSections).flat(),
    ...Object.keys(order.sharedSections),
  ]);
  const actual = removeMarkdownCode(readme)
    .split(/\r?\n/u)
    .filter((line) => /^##\s+/u.test(line))
    .map((line) => line.slice(3).trim())
    .filter((heading) => profileSections.has(heading));
  const selected = expected.filter((heading) => profileSections.has(heading));
  return isSubsequence(actual, selected)
    ? null
    : "README.md profile sections must use canonical order.";
}

function isSubsequence(actual, expected) {
  const indexes = actual.map((heading) => expected.indexOf(heading));
  return indexes.every(
    (index, position) => index >= 0 && (position === 0 || index > indexes[position - 1]),
  );
}
