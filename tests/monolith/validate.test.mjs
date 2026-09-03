import { findMonolithViolations } from '../../src/monolith/validate.mjs';

test('returns oversized files', async () => {
  const violations = await findMonolithViolations('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'large.mjs', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true }],
    readSource: async () => `${'x\n'.repeat(301)}`
  });
  expect(violations[0]).toMatchObject({ kind: 'source', threshold: 300 });
});
