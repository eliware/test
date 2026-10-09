import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";

const requiredMarkers = [
  "Node.js 26",
  "native ESM",
  "npm test",
  "npm run lint",
  "npm run audit",
  "npm run format",
  "npm run format:check",
];

export function validateAgentsContent(content) {
  const markdown = removeMarkdownCode(content, { preserveInlineCodeText: true });
  const missing = requiredMarkers.filter((marker) => !markdown.includes(marker));
  return missing.length ? [`AGENTS.md must include: ${missing.join(", ")}.`] : [];
}
