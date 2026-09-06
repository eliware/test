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
  const specificationDocuments = [...specTexts.entries()].filter(([file]) => !['README.md', 'index.md', 'SPEC.md'].includes(file.replace(/^specs[\\/]/i, '').toLowerCase()));
  if (!specificationDocuments.some(([, text]) => /requirements?|must|shall|normative/i.test(text))) findings.push(finding('specs/: must contain a document stating specification requirements'));
  if (!specificationDocuments.some(([, text]) => /out\s+of\s+scope/i.test(text))) findings.push(finding('specs/: must contain a separate document with an explicit out-of-scope heading'));
  return findings;
}
