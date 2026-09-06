import { checkDocumentationFiles } from './check-documentation-files.mjs';
import { checkIndexedDocumentation } from './check-indexed-documentation.mjs';
import { checkExampleDocumentation } from './check-example-documentation.mjs';
function finding(message) { return { group: 'documentation', message }; }

export async function readDocumentationIndexes(root, files, read) {
  const directories = [...new Set(files.map((file) => file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '').filter(Boolean))];
  return new Map(await Promise.all(directories.map(async (directory) => [directory, await read(`${root}/${directory}/README.md`)])));
}

export function checkDocumentationIndexes({ docsFiles, docsReadme, specFiles, specsReadme, examples, examplesReadme, specTexts = new Map(), exampleReadmes = new Map(), docsIndexes = new Map(), specIndexes = new Map(), nonMarkdownFiles = [], exampleFiles = [], documentationTexts = new Map() }) {
  const findings = [
    ...checkDocumentationFiles(nonMarkdownFiles, documentationTexts),
    ...checkIndexedDocumentation({ docsFiles, docsReadme, specFiles, specsReadme, docsIndexes, specIndexes }),
    ...checkExampleDocumentation({ examples, examplesReadme, exampleReadmes, exampleFiles }),
  ];
  if (!specFiles.some((file) => file !== 'README.md' && /requirements?|must|shall|normative/i.test(specTexts.get(file) ?? ''))) findings.push(finding('specs/: must contain a document stating specification requirements'));
  if (!specFiles.some((file) => file !== 'README.md' && /out\s+of\s+scope/i.test(specTexts.get(file) ?? ''))) findings.push(finding('specs/: must contain a separate document with an explicit out-of-scope heading'));
  return findings;
}
