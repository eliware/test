import { detectViolations } from '../../src/monolith/detect-violations.mjs';

test('returns oversized source files', async () => {
  const violations = await detectViolations('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'large.mjs', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true, isFile: () => false }],
    readSource: async () => `${'x\n'.repeat(301)}`
  });
  expect(violations[0]).toMatchObject({ kind: 'source', threshold: 300 });
});

test('does not report pure barrels', async () => {
  const violations = await detectViolations('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'index.mjs', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true, isFile: () => false }],
    readSource: async () => `${'export { value };\n'.repeat(301)}`
  });
  expect(violations).toEqual([]);
});

test('skips generated files and configured exemptions', async () => {
  const entries = [
    { name: 'generated.mjs', isDirectory: () => false, isFile: () => true },
    { name: 'exempt.mjs', isDirectory: () => false, isFile: () => true }
  ];
  const violations = await detectViolations('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src') ? entries : [{ name: 'src', isDirectory: () => true, isFile: () => false }],
    readSource: async (path) => path.endsWith('generated.mjs') ? `${'x\n'.repeat(301)}// @generated` : `${'x\n'.repeat(301)}`,
    readFilePath: async (path) => path.endsWith('package.json')
      ? JSON.stringify({ eliwareTest: { monolithLimits: { exemptions: [{ pattern: 'src/exempt.mjs', reason: 'intentional' }] } } })
      : ''
  });
  expect(violations).toEqual([]);
});

test('classifies supported source and test files during discovery', async () => {
  const violations = await detectViolations('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }, { name: 'notes.md', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true, isFile: () => false }],
    readSource: async () => ''
  });
  expect(violations).toEqual([]);
});

test('handles empty directories and non-file entries', async () => {
  await expect(detectViolations('C:/repo', {
    readDirectory: async () => [{ name: 'link', isDirectory: () => false, isFile: () => false }]
  })).resolves.toEqual([]);
});
