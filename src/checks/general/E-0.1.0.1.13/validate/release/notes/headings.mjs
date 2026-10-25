import { removeMarkdownCode } from "../../../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";

export function releaseEntryHeadings(content) {
  const normalized = content.replace(/^\uFEFF/u, "");
  const lines = removeMarkdownCode(normalized).split(/\r?\n/u);
  return lines.filter((line) => /^##\s/u.test(line));
}
