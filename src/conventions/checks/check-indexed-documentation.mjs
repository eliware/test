import { hasDirectLink } from './documentation-links.mjs';
import { checkDocumentationTree } from './documentation-tree.mjs';

function finding(message) { return { group: 'documentation', message }; }

/** Validate docs/spec indexes and their required root navigation. */
export function checkIndexedDocumentation({ docsFiles, docsReadme, specFiles, specsReadme, docsIndexes = new Map(), specIndexes = new Map() }) {
  const findings = [];
  if (!docsFiles.includes('README.md') || !docsReadme?.trim()) findings.push(finding('docs/README.md: required index is missing or empty'));
  if (!specFiles.includes('README.md') || !specsReadme?.trim()) findings.push(finding('specs/README.md: required index is missing or empty'));
  if (!docsFiles.includes('README.md') || docsFiles.length < 3) findings.push(finding('docs/: must contain README.md and at least two additional Markdown documents'));
  for (const [label, files, index, nestedIndexes] of [['docs', docsFiles, docsReadme, docsIndexes], ['specs', specFiles, specsReadme, specIndexes]]) {
    const indexes = new Map([['', index], ...nestedIndexes]);
    if (index && !hasDirectLink(index, '../README.md', label)) findings.push(finding(`${label}/README.md: missing link back to the root README`));
    checkDocumentationTree(label, files, indexes, findings);
  }
  if (!specFiles.includes('README.md')) findings.push(finding('specs/: must contain README.md as its index'));
  if ((specsReadme && !/normative|mandatory|required/i.test(specsReadme)) || (specsReadme && !/scope/i.test(specsReadme))) findings.push(finding('specs/README.md: must state specification scope and normative status'));
  if (docsReadme && !/documentation|user|maintainer/i.test(docsReadme)) findings.push(finding('docs/README.md: must state its audience and documentation purpose'));
  return findings;
}
