import { checkDocumentationFiles } from '../../../src/conventions/checks/check-documentation-files.mjs';

test('warns on unlinked non-Markdown documentation', () => {
  expect(checkDocumentationFiles()).toEqual([]);
  expect(checkDocumentationFiles(['docs/guide.txt'], new Map())).toHaveLength(2);
  expect(checkDocumentationFiles(['docs/guide.txt'], new Map([['README.md', '[guide](docs/guide.txt)']]))).toHaveLength(1);
});
