import { checkIndexedDocumentation } from '../../../src/conventions/checks/check-indexed-documentation.mjs';

test('checks index links and required documentation markers', () => {
  expect(checkIndexedDocumentation({ docsFiles: [], docsReadme: '', specFiles: [], specsReadme: '' })).toEqual(expect.any(Array));
  const findings = checkIndexedDocumentation({ docsFiles: ['README.md'], docsReadme: '', specFiles: ['README.md'], specsReadme: 'scope normative', docsIndexes: new Map(), specIndexes: new Map() });
  expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('docs/') })]));
});

test('fails when required indexes are missing or empty', () => {
  const findings = checkIndexedDocumentation({ docsFiles: ['README.md'], docsReadme: ' ', specFiles: ['README.md'], specsReadme: '' });
  expect(findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ message: 'docs/README.md: required index is missing or empty' }),
    expect.objectContaining({ message: 'specs/README.md: required index is missing or empty' }),
  ]));
});
