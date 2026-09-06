import { checkRepositoryDriftFiles } from '../../../src/conventions/checks/drift-files.mjs';

test('rejects repository-local known_drifts files', () => {
  expect(checkRepositoryDriftFiles(new Set(['known_drifts.md', 'docs/known_drifts.md', 'src/value.mjs']))).toEqual([
    { group: 'conventions', message: 'repository: local known_drifts.md is prohibited: known_drifts.md' },
    { group: 'conventions', message: 'repository: local known_drifts.md is prohibited: docs/known_drifts.md' },
  ]);
});
