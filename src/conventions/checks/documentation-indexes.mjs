const LINK_PATTERN = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
function finding(message) { return { group: 'documentation', message }; }
function normalize(link) { return link.replace(/[?#].*$/, '').replace(/^\.\//, '').replace(/\/$/, ''); }
function hasDirectLink(source, target) { return [...source.matchAll(LINK_PATTERN)].some(([, link]) => normalize(link) === normalize(target)); }
function hasDescribedLink(source, target) { return [...source.matchAll(LINK_PATTERN)].some(([full, link]) => normalize(link) === normalize(target) && full.slice(full.indexOf('[') + 1, full.indexOf(']')).trim()); }
export function checkDocumentationIndexes({ docsFiles, docsReadme, specFiles, specsReadme, examples, examplesReadme, specTexts = new Map(), exampleReadmes = new Map() }) {
  const findings = [];
  if (!docsFiles.includes('README.md') || docsFiles.length < 3) findings.push(finding('docs/: must contain README.md and at least two additional Markdown documents'));
  for (const [label, files, index] of [['docs', docsFiles, docsReadme], ['specs', specFiles, specsReadme]]) {
    if (!index) findings.push(finding(`${label}/README.md: missing documentation index`));
    else {
      if (!hasDirectLink(index, '../README.md') && !hasDirectLink(index, 'README.md')) findings.push(finding(`${label}/README.md: missing link back to the root README`));
      for (const file of files.filter((entry) => entry !== 'README.md')) {
        if (!hasDirectLink(index, file)) findings.push(finding(`${label}/README.md: missing link to ${file}`));
        else if (!hasDescribedLink(index, file)) findings.push(finding(`${label}/README.md: link to ${file} needs a description`));
      }
    }
  }
  if (!specFiles.includes('README.md')) findings.push(finding('specs/: must contain README.md as its index'));
  if (!specFiles.some((file) => file !== 'README.md' && /requirements?|must|shall|normative/i.test(specTexts.get(file) ?? ''))) findings.push(finding('specs/: must contain a document stating specification requirements'));
  if (!specFiles.some((file) => file !== 'README.md' && /out\s+of\s+scope/i.test(specTexts.get(file) ?? ''))) findings.push(finding('specs/: must contain a separate document with an explicit out-of-scope heading'));
  if ((specsReadme && !/normative|mandatory|required/i.test(specsReadme)) || (specsReadme && !/scope/i.test(specsReadme))) findings.push(finding('specs/README.md: must state specification scope and normative status'));
  if (docsReadme && !/documentation|user|maintainer/i.test(docsReadme)) findings.push(finding('docs/README.md: must state its audience and documentation purpose'));
  if (!examplesReadme) findings.push(finding('examples/README.md: missing example index'));
  else {
    if (!hasDirectLink(examplesReadme, '../README.md')) findings.push(finding('examples/README.md: missing link back to the root README'));
    for (const example of examples) {
      const target = hasDirectLink(examplesReadme, example) ? example : `${example}/`;
      if (!hasDirectLink(examplesReadme, example) && !hasDirectLink(examplesReadme, target)) findings.push(finding(`examples/README.md: missing link to ${example}`));
      else if (!hasDescribedLink(examplesReadme, target)) findings.push(finding(`examples/README.md: link to ${example} needs a description`));
      const readme = exampleReadmes.get(example) ?? '';
      if (!/prerequisite|setup/i.test(readme) || !/usage|run|command/i.test(readme) || !/expected|result/i.test(readme)) findings.push(finding(`examples/${example}/README.md: must document prerequisites, usage, and expected results`));
    }
  }
  if (!examples.length) findings.push(finding('examples/: must contain at least one runnable example directory'));
  if (examplesReadme && (!/prerequisite|setup/i.test(examplesReadme) || !/expected|result/i.test(examplesReadme) || !/placeholder|secret/i.test(examplesReadme))) findings.push(finding('examples/README.md: must document prerequisites, expected results, and secret-safe placeholders'));
  return findings;
}
