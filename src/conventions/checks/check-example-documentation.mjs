import { hasDescribedLink, hasDirectLink } from './documentation-links.mjs';

function finding(message) { return { group: 'documentation', message }; }

/** Validate example index links and per-example user guidance. */
export function checkExampleDocumentation({ examples = [], examplesReadme, exampleReadmes = new Map(), exampleFiles = [] } = {}) {
  const findings = [];
  for (const file of exampleFiles) if (!hasDirectLink(examplesReadme ?? '', file, 'examples')) findings.push(finding(`examples/README.md: missing link to file ${file}`));
  if (!examplesReadme) findings.push(finding('examples/README.md: missing example index'));
  else {
    if (!hasDirectLink(examplesReadme, '../README.md', 'examples')) findings.push(finding('examples/README.md: missing link back to the root README'));
    for (const example of examples) {
      const target = `${example}/README.md`;
      if (!hasDirectLink(examplesReadme, target, 'examples')) findings.push(finding(`examples/README.md: missing link to ${example}`));
      else if (!hasDescribedLink(examplesReadme, target, 'examples')) findings.push(finding(`examples/README.md: link to ${example} needs a description`));
      const readme = exampleReadmes.get(example) ?? '';
      if (!/prerequisite|setup/i.test(readme) || !/usage|run|command/i.test(readme) || !/expected|result/i.test(readme)) findings.push(finding(`examples/${example}/README.md: must document prerequisites, usage, and expected results`));
    }
  }
  if (!examples.length) findings.push(finding('examples/: must contain at least one runnable example directory'));
  if (examplesReadme && (!/prerequisite|setup/i.test(examplesReadme) || !/expected|result/i.test(examplesReadme) || !/placeholder|secret/i.test(examplesReadme))) findings.push(finding('examples/README.md: must document prerequisites, expected results, and secret-safe placeholders'));
  return findings;
}
