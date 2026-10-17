import { posix } from "node:path";
import { extractMarkdownLinks } from "../../../general/E-0.1.0.1.4/extract-markdown/links.mjs";
import { removeMarkdownCode } from "../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";

export function validateRunbookIndex(content, runbooks) {
  const body = removeMarkdownCode(content);
  const lines = body.split(/\r?\n/u).filter((line) => line.trim());
  const definitions = new Set(
    [...body.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(?:<[^>\r\n]+>|\S+)/gimu)].map((match) =>
      normalizeLabel(match[1]),
    ),
  );
  const errors = lines.some((line) => !isNavigationLine(line, definitions))
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

function isNavigationLine(line, definitions) {
  if (/^\s{0,3}#{1,6}\s+\S.*$/u.test(line)) return true;
  if (/^\s{0,3}\[[^\]]+\]:\s*(?:<[^>\r\n]+>|\S+)(?:\s+.*)?$/u.test(line)) return true;
  const link = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)\[([^\]]+)\](.*)$/u);
  if (!link) return false;
  const suffix = link[2].trim();
  if (/^\((?:<[^>\r\n]+>|[^)\r\n]+)\)$/u.test(suffix)) return true;
  if (/^\[[^\]]*\]$/u.test(suffix)) return true;
  return !suffix && definitions.has(normalizeLabel(link[1]));
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}
