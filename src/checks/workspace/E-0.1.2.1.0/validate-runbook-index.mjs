import { posix } from "node:path";
import {
  extractMarkdownLinks,
  removeMarkdownCode,
} from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";

export function validateRunbookIndex(content, runbooks) {
  const body = removeMarkdownCode(content);
  const lines = body.split(/\r?\n/u).filter((line) => line.trim());
  const allowedLine =
    /^(?:\s{0,3}#{1,6}\s+\S.*|\s*(?:[-*+]\s+|\d+[.)]\s+)\[[^\]]+\]\([^)]+\)\s*)$/u;
  const errors = lines.some((line) => !allowedLine.test(line))
    ? ["runbooks/README.md must contain only headings and runbook links."]
    : [];
  const expected = new Set(runbooks.map((path) => path.slice("runbooks/".length)));
  const actual = extractMarkdownLinks(content).map(({ reference }) => {
    if (!reference || /^(?:[a-z]+:|\/|#)/iu.test(reference)) return null;
    const normalized = posix.normalize(posix.join("runbooks", reference));
    return normalized.startsWith("runbooks/") ? normalized.slice("runbooks/".length) : null;
  });
  if (actual.some((path) => path === null || !path.endsWith(".yaml")))
    errors.push("runbooks/README.md may link only to .yaml runbooks.");
  if (new Set(actual).size !== actual.length)
    errors.push("runbooks/README.md must link each runbook once.");
  if (actual.length !== expected.size || actual.some((path) => !expected.has(path)))
    errors.push("runbooks/README.md must link every runbook.");
  return errors;
}
