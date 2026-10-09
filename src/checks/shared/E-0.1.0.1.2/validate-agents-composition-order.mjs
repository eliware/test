import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateAgentsCompositionOrder(content, packageJson = {}) {
  const order = readCanonicalOrder("agents-sections.yaml");
  const allHeadings = new Set(Object.values(order.profileHeadings));
  const actual = removeMarkdownCode(content)
    .split(/\r?\n/u)
    .filter((line) => /^##\s+/u.test(line))
    .map((line) => line.slice(3).trim())
    .filter((heading) => allHeadings.has(heading));
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const expected = order.profileOrder
    .filter((profile) => applied.has(profile))
    .map((profile) => order.profileHeadings[profile]);
  return isSubsequence(actual, expected)
    ? []
    : ["AGENTS.md profile headings must use canonical order after Changes."];
}

function isSubsequence(actual, expected) {
  const indexes = actual.map((heading) => expected.indexOf(heading));
  return indexes.every(
    (index, position) => index >= 0 && (position === 0 || index > indexes[position - 1]),
  );
}
