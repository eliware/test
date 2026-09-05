import { checkDocumentationIndexes } from '../../../src/conventions/checks/documentation-indexes.mjs';

test('requires indexed documentation to link and describe contents', () => {
  const findings = checkDocumentationIndexes({ docsFiles: ['README.md', 'guide.md'], docsReadme: '', specFiles: [], specsReadme: '', examples: [], examplesReadme: '' });
  expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('docs/') }), expect.objectContaining({ message: expect.stringContaining('specs/') }), expect.objectContaining({ message: expect.stringContaining('examples/') })]));
});

test('accepts complete documentation indexes and checks descriptions', () => {
  const index = '[Root](../README.md)\n[Guide](guide.md)';
  expect(checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md', 'other.md'], docsReadme: `Documentation for users. ${index}\n[Other](other.md)`,
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: '[Root](../README.md)\n[Req](requirements.md)\n[Out](out.md) normative scope',
    examples: ['demo'], examplesReadme: '[Root](../README.md)\n[Demo](demo) prerequisite expected result placeholder secret',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup usage expected result']]),
  })).toEqual([]);
});

test('reports missing links, descriptions, and example guidance', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md'], docsReadme: '[](guide.md)',
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: 'scope normative',
    examples: ['demo', 'missing'], examplesReadme: '[](demo)',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup']]),
  }).map(({ message }) => message);
  expect(findings).toEqual(expect.arrayContaining([
    expect.stringContaining('needs a description'), expect.stringContaining('missing link to missing'),
    expect.stringContaining('must document prerequisites'),
  ]));
  expect(checkDocumentationIndexes({ docsFiles: ['README.md'], docsReadme: '', specFiles: ['README.md', 'x.md'], specsReadme: 'scope', examples: [], examplesReadme: '' })).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('requirements') })]));
});
