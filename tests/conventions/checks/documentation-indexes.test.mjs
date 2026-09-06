import { checkDocumentationIndexes, readDocumentationIndexes } from '../../../src/conventions/checks/documentation-indexes.mjs';

test('reads nested documentation indexes', async () => {
  await expect(readDocumentationIndexes('docs', ['README.md', 'guides/setup.md'], async (path) => `${path} index`))
    .resolves.toEqual(new Map([['guides', 'docs/guides/README.md index']]));
});

test('accepts complete docs, specs, and example indexes', () => {
  expect(checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md', 'security.md'], docsReadme: '[Root](../README.md)\n[Guide](guide.md) documentation\n[Security](security.md)',
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: '[Root](../README.md) scope normative [Req](requirements.md) [Out](out.md)',
    examples: ['demo'], examplesReadme: '[Root](../README.md) [Demo](demo/README.md) prerequisite expected result placeholder secret',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup usage expected result']]),
  })).toEqual([]);
});

test('reports missing required documentation structure and guidance', () => {
  const findings = checkDocumentationIndexes({ docsFiles: ['guide.md'], docsReadme: '', specFiles: ['README.md', 'x.md'], specsReadme: 'scope', examples: ['demo'], examplesReadme: '' }).map(({ message }) => message);
  expect(findings).toEqual(expect.arrayContaining([
    expect.stringContaining('docs/: must contain README.md'),
    expect.stringContaining('specification'), expect.stringContaining('examples/README.md'),
  ]));
});

test('checks root links, descriptions, and example documentation', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md'], docsReadme: '[](guide.md)',
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: 'scope normative',
    examples: ['demo'], examplesReadme: '[](demo/README.md)',
    specTexts: new Map([['requirements.md', 'requirements'], ['out.md', 'out of scope']]), exampleReadmes: new Map([['demo', 'setup']]),
  }).map(({ message }) => message);
  expect(findings).toEqual(expect.arrayContaining([expect.stringContaining('needs a description'), expect.stringContaining('must document prerequisites')]));
});

test('requires every non-Markdown documentation and example file to be linked', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['README.md'], docsReadme: '[Root](../README.md)', specFiles: [], specsReadme: '', examples: ['demo'], examplesReadme: '[Demo](demo/README.md)',
    nonMarkdownFiles: ['docs/diagram.svg'], exampleFiles: ['demo/package.json'], documentationTexts: new Map([['README.md', '[Diagram](docs/diagram.svg)']]),
  }).map(({ message }) => message);
  expect(findings).toEqual(expect.arrayContaining([expect.stringContaining('demo/package.json')]));
  expect(findings).not.toEqual(expect.arrayContaining([expect.stringContaining('non-Markdown documentation file is not linked')]));
});

test('reports unlinked documentation and examples', () => {
  const findings = checkDocumentationIndexes({
    docsFiles: ['README.md', 'guide.md', 'security.md'], docsReadme: '[Root](../README.md) [Guide](guide.md) [Security](security.md)',
    specFiles: ['README.md', 'requirements.md', 'out.md'], specsReadme: '[Root](../README.md) [Req](requirements.md) [Out](out.md) scope normative',
    examples: ['demo'], examplesReadme: '[Root](../README.md)', nonMarkdownFiles: ['docs/diagram.svg'], exampleFiles: ['demo/package.json'],
  }).map(({ message }) => message);
  expect(findings).toEqual(expect.arrayContaining([
    expect.stringContaining('non-Markdown documentation file is not linked'),
    expect.stringContaining('missing link to file demo/package.json'),
  ]));
});

test('handles example files when their index is absent', () => {
  expect(checkDocumentationIndexes({ docsFiles: ['README.md', 'guide.md', 'security.md'], docsReadme: '[Root](../README.md) [Guide](guide.md) [Security](security.md)', specFiles: [], specsReadme: '', examples: [], exampleFiles: ['demo/package.json'] }).map(({ message }) => message))
    .toContain('examples/README.md: missing link to file demo/package.json');
});
