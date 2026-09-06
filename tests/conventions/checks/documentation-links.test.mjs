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
