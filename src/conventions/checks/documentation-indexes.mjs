import { posix } from 'node:path';

const LINK_PATTERN = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
function finding(message) { return { group: 'documentation', message }; }
function resolveIndexLink(link, directory) { return posix.normalize(posix.join(directory, link.replace(/[?#].*$/, ''))); }
function hasDirectLink(source, target, directory) { return [...source.matchAll(LINK_PATTERN)].some(([, link]) => resolveIndexLink(link, directory) === resolveIndexLink(target, directory)); }
function hasDescribedLink(source, target, directory) { return [...source.matchAll(LINK_PATTERN)].some(([full, link]) => resolveIndexLink(link, directory) === resolveIndexLink(target, directory) && full.slice(full.indexOf('[') + 1, full.indexOf(']')).trim()); }
function hasFileLink(source, target, files, directory) { return [...source.matchAll(LINK_PATTERN)].some(([, link]) => resolveIndexLink(link, directory) === resolveIndexLink(target, directory) && files.has(resolveIndexLink(link, directory))); }
function checkTree(label, files, indexes, findings) {
  const allFiles = new Set(files.map((file) => `${label}/${file}`));
  for (const [directory, index] of indexes) {
    const indexDirectory = directory ? `${label}/${directory}` : label;
    const directFiles = files.filter((file) => (posix.dirname(file) === '.' ? '' : posix.dirname(file)) === directory && posix.basename(file).toLowerCase() !== 'readme.md');
    const prefix = directory ? `${directory}/` : '';
    const childDirectories = [...new Set(files.filter((file) => file.startsWith(prefix)).map((file) => file.slice(prefix.length).split('/')[0]).filter((part) => part && files.some((file) => file.startsWith(`${prefix}${part}/`))))];
    if (!index) { findings.push(finding(`${label}/${directory || 'README.md'}: missing documentation index`)); continue; }
    for (const file of directFiles) {
      const target = directory ? file.slice(directory.length + 1) : file;
      if (!hasFileLink(index, target, allFiles, indexDirectory)) findings.push(finding(`${label}/${directory ? `${directory}/` : ''}README.md: missing link to file ${file}`));
      else if (!hasDescribedLink(index, target, indexDirectory)) findings.push(finding(`${label}/${directory ? `${directory}/` : ''}README.md: link to ${file} needs a description`));
    }
    for (const child of childDirectories) {
      const target = `${child}/README.md`;
      if (!hasDirectLink(index, target, indexDirectory)) findings.push(finding(`${label}/${directory || 'README.md'}: missing link to nested index ${target}`));
    }
  }
}

export async function readDocumentationIndexes(root, files, read) {
  const directories = [...new Set(files.map((file) => file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '').filter(Boolean))];
  return new Map(await Promise.all(directories.map(async (directory) => [directory, await read(`${root}/${directory}/README.md`)])));
}

export function checkDocumentationIndexes({ docsFiles, docsReadme, specFiles, specsReadme, examples, examplesReadme, specTexts = new Map(), exampleReadmes = new Map(), docsIndexes = new Map(), specIndexes = new Map() }) {
  const findings = [];
  if (!docsFiles.includes('README.md') || docsFiles.length < 3) findings.push(finding('docs/: must contain README.md and at least two additional Markdown documents'));
  for (const [label, files, index] of [['docs', docsFiles, docsReadme], ['specs', specFiles, specsReadme]]) {
    const indexes = new Map([['', index], ...(label === 'docs' ? docsIndexes : specIndexes)]);
    if (index && !hasDirectLink(index, '../README.md', label)) findings.push(finding(`${label}/README.md: missing link back to the root README`));
    checkTree(label, files, indexes, findings);
  }
  if (!specFiles.includes('README.md')) findings.push(finding('specs/: must contain README.md as its index'));
  if (!specFiles.some((file) => file !== 'README.md' && /requirements?|must|shall|normative/i.test(specTexts.get(file) ?? ''))) findings.push(finding('specs/: must contain a document stating specification requirements'));
  if (!specFiles.some((file) => file !== 'README.md' && /out\s+of\s+scope/i.test(specTexts.get(file) ?? ''))) findings.push(finding('specs/: must contain a separate document with an explicit out-of-scope heading'));
  if ((specsReadme && !/normative|mandatory|required/i.test(specsReadme)) || (specsReadme && !/scope/i.test(specsReadme))) findings.push(finding('specs/README.md: must state specification scope and normative status'));
  if (docsReadme && !/documentation|user|maintainer/i.test(docsReadme)) findings.push(finding('docs/README.md: must state its audience and documentation purpose'));
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
