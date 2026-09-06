import { hasAnyFileLink, hasDescribedLink, hasFileLink } from '../../../src/conventions/checks/documentation-links.mjs';

test('resolves described links from nested and root documents', () => {
  expect(hasDescribedLink('[Guide](guide.md)', 'guide.md', 'docs')).toBe(true);
  expect(hasAnyFileLink(new Map([['README.md', '[Guide](docs/guide.md)']]), 'docs/guide.md')).toBe(true);
});

test('reports no match when a file is not linked', () => {
  expect(hasAnyFileLink(new Map([['README.md', '[Guide](docs/guide.md)']]), 'docs/missing.md')).toBe(false);
});

test('resolves nested index links in the repository file namespace', () => {
  expect(hasFileLink('[Guide](guide.md)', 'guide.md', new Set(['docs/nested/guide.md']), 'docs/nested')).toBe(true);
});

test('normalizes repository file namespaces before matching links', () => {
  expect(hasFileLink('[Guide](./guide.md#intro)', './guide.md', new Set(['./docs/nested/guide.md']), './docs/nested')).toBe(true);
});

test('resolves nested source documents and Windows separators', () => {
  expect(hasAnyFileLink(new Map([['docs\\nested\\README.md', '[Diagram](../diagram.svg)']]), 'docs/diagram.svg')).toBe(true);
});
