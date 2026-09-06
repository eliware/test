import { checkDocumentationIndexes, readDocumentationIndexes } from '../../../src/conventions/checks/documentation-indexes.mjs';

test('reads nested documentation indexes', async () => {
  await expect(readDocumentationIndexes('docs', ['README.md', 'guides/setup.md', 'guides/README.md'], async (path) => `${path} index`))
    .resolves.toEqual(new Map([['guides', 'docs/guides/README.md index']]));
});

test('requires indexed documentation to link and describe contents', () => {
  const findings = checkDocumentationIndexes({ docsFiles: ['README.md', 'guide.md'], docsReadme: '', specFiles: [], specsReadme: '', examples: [], examplesReadme: '' });
  expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('docs/') }), expect.objectContaining({ message: expect.stringContaining('specs/') }), expect.objectContaining({ message: expect.stringContaining('examples/') })]));
});

test('accepts complete documentation indexes and checks descriptions', () => {
  const index = '[Root](../README.md)\n[Guide](guide.md)';
  expect(checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md', 'other.md'], docsReadme: `Documentation for users. ${index}\n[Other](other.md)`,
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: '[Root](../README.md)\n[Req](requirements.md)\n[Out](out.md) normative scope',
    examples: ['demo'], examplesReadme: '[Root](../README.md)\n[Demo](demo/README.md) prerequisite expected result placeholder secret',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup usage expected result']]),
})).toEqual([]);
});

test('resolves equivalent relative links from each index directory', () => {
  expect(checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md', 'other.md'], docsReadme: '[Root](./../README.md)\n[Guide](./guide.md) documentation\n[Other](other.md)',
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: '[Root](./../README.md)\n[Req](./requirements.md) requirements\n[Out](out.md) normative scope',
    examples: ['demo'], examplesReadme: '[Root](./../README.md)\n[Demo](./demo/README.md) prerequisite usage expected result placeholder secret',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup usage expected result']]),
  })).toEqual([]);
});

test('requires nested indexes and their nested links', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guides/setup.md', 'guides/README.md'], docsReadme: 'Documentation for users. [Root](../README.md)\n[Guides](guides/README.md) index',
    docsIndexes: new Map([['guides', '[Setup](setup.md) setup']]),
    specFiles: [], specsReadme: '', examples: [], examplesReadme: '',
  });
  expect(findings.filter(({ message }) => message.startsWith('docs/'))).toEqual([]);
  expect(checkDocumentationIndexes({
    docsFiles: ['README.md', 'guides/setup.md'], docsReadme: '[Root](../README.md)',
    docsIndexes: new Map(), specFiles: [], specsReadme: '', examples: [], examplesReadme: '',
  }).map(({ message }) => message)).toEqual(expect.arrayContaining([expect.stringContaining('missing documentation index')]));
  const nestedFindings = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guides/setup.md'], docsReadme: 'Documentation [Root](../README.md) [Guides](guides/README.md)',
    docsIndexes: new Map([['guides', '[](other.md)']]), specFiles: [], specsReadme: '', examples: [], examplesReadme: '',
  }).map(({ message }) => message);
  expect(nestedFindings).toEqual(expect.arrayContaining([expect.stringContaining('missing link to file guides/setup.md')]));
  const missingNestedIndex = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guides/setup.md'], docsReadme: 'Documentation [Root](../README.md) [Guides](guides/README.md)',
    docsIndexes: new Map([['guides', '']]), specFiles: [], specsReadme: '', examples: [], examplesReadme: '',
  }).map(({ message }) => message);
  expect(missingNestedIndex).toEqual(expect.arrayContaining([expect.stringContaining('missing documentation index')]));
  const undescribedNestedFile = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guides/setup.md'], docsReadme: 'Documentation [Root](../README.md) [Guides](guides/README.md)',
    docsIndexes: new Map([['guides', '[](setup.md)']]), specFiles: [], specsReadme: '', examples: [], examplesReadme: '',
  }).map(({ message }) => message);
  expect(undescribedNestedFile).toEqual(expect.arrayContaining([expect.stringContaining('needs a description')]));
});

test('reports missing links, descriptions, and example guidance', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md'], docsReadme: '[](guide.md)',
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: 'scope normative',
    examples: ['demo', 'missing'], examplesReadme: '[](demo/README.md)',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup']]),
  }).map(({ message }) => message);
  expect(findings).toEqual(expect.arrayContaining([
    expect.stringContaining('needs a description'), expect.stringContaining('missing link to missing'),
    expect.stringContaining('must document prerequisites'),
  ]));
  expect(checkDocumentationIndexes({ docsFiles: ['README.md'], docsReadme: '', specFiles: ['README.md', 'x.md'], specsReadme: 'scope', examples: [], examplesReadme: '' })).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('requirements') })]));
});

test('requires docs README even when enough other Markdown files exist', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['guide.md', 'reference.md', 'security.md'], docsReadme: '',
    specFiles: [], specsReadme: '', examples: [], examplesReadme: '',
  });
  expect(findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ message: expect.stringContaining('docs/: must contain README.md') }),
  ]));
});
