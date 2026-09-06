import { hasAnyFileLink } from './documentation-links.mjs';

/** Report non-Markdown documentation files and missing Markdown links. */
export function checkDocumentationFiles(nonMarkdownFiles = [], documentationTexts = new Map()) {
  const findings = [];
  for (const file of nonMarkdownFiles) {
    findings.push({ group: 'documentation', severity: 'warning', message: `${file}: non-Markdown documentation file found; link it from a Markdown document or remove it` });
    if (!hasAnyFileLink(documentationTexts, file)) findings.push({ group: 'documentation', message: `${file}: non-Markdown documentation file is not linked from any Markdown document` });
  }
  return findings;
}
