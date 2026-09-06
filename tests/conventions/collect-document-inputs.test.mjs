import { collectDocumentInputs } from '../../src/conventions/collect-document-inputs.mjs';

test('loads specification and source environment inputs', async () => {
  const read = Object.assign(async (path) => path === 'specs/README.md' ? 'overview' : 'source', { readFile: async () => JSON.stringify({}) });
  const result = await collectDocumentInputs({ cwd: '.', read, readDirectoryOnce: async () => [], paths: new Set(['src/value.mjs']), files: new Set(), specFiles: ['README.md'] });
  expect(result).toEqual(expect.objectContaining({ specText: 'overview', environmentSources: ['source'] }));
});
