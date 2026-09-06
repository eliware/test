import { checkDocumentationTree } from '../../../src/conventions/checks/documentation-tree.mjs';

test('checks direct files and nested indexes', () => {
  const findings = [];
  checkDocumentationTree('docs', ['README.md', 'guide.md', 'nested/README.md'], new Map([['', '[Guide](guide.md)']]), findings);
  expect(findings.map(({ message }) => message)).toEqual(expect.arrayContaining([
    expect.stringContaining('missing link to nested index nested/README.md'),
  ]));
});

test('accepts linked nested indexes and files', () => {
  const findings = [];
  checkDocumentationTree('docs', ['README.md', 'guide.md', 'nested/README.md', 'nested/setup.md'], new Map([
    ['', '[Guide](guide.md) guide [Nested](nested/README.md)'],
    ['nested', '[Setup](setup.md) setup'],
  ]), findings);
  expect(findings).toEqual([]);
});

test('reports a missing nested index', () => {
  const findings = [];
  checkDocumentationTree('docs', ['README.md', 'nested/setup.md'], new Map([['', '[Root](../README.md)']]), findings);
  expect(findings.map(({ message }) => message)).toContain('docs/README.md: missing link to nested index nested/README.md');
});

test('reports unlinked and undescribed direct files', () => {
  const findings = [];
  checkDocumentationTree('docs', ['README.md', 'missing.md', 'plain.md'], new Map([['', '[](plain.md)']]), findings);
  expect(findings.map(({ message }) => message)).toEqual(expect.arrayContaining([
    expect.stringContaining('missing link to file missing.md'),
    expect.stringContaining('plain.md needs a description'),
  ]));
});

test('formats nested direct-file diagnostics', () => {
  const findings = [];
  checkDocumentationTree('docs', ['README.md', 'nested/README.md', 'nested/missing.md', 'nested/plain.md'], new Map([
    ['', '[Nested](nested/README.md)'], ['nested', '[](plain.md)'],
  ]), findings);
  expect(findings.map(({ message }) => message)).toEqual(expect.arrayContaining([
    expect.stringContaining('nested/missing.md'), expect.stringContaining('nested/plain.md needs a description'),
  ]));
});
