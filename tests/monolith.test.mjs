import { discoverMonolithFiles } from '../src/monolith/discover-files.mjs';
import { classifyFile, isGeneratedFile } from '../src/monolith/classify-file.mjs';
import { matchesExemption, readMonolithConfig } from '../src/monolith/config.mjs';
import { formatMonolithViolations } from '../src/monolith/diagnostics.mjs';
import { findMonolithViolations } from '../src/monolith/validate.mjs';
import { MONOLITH_EXIT_CODE, DEFAULT_LIMITS } from '../src/monolith/constants.mjs';

test('classifies source and test files and generated markers', () => {
  expect(classifyFile('src/a.mjs')).toBe('source');
  expect(classifyFile('tests/a.test.mjs')).toBe('test');
  expect(classifyFile('docs/a.md')).toBe('');
  expect(isGeneratedFile('src/generated/a.mjs', '')).toBe(true);
  expect(isGeneratedFile('src/a.generated.mjs', '')).toBe(true);
  expect(isGeneratedFile('src/a.mjs', '// @generated')).toBe(true);
});

test('discovers files and recognizes pure barrels', async () => {
  const entries = [{ name: 'src', isDirectory: () => true }, { name: 'a.mjs', isDirectory: () => false, isFile: () => true }];
  const files = await discoverMonolithFiles('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src') ? [{ name: 'a.mjs', isDirectory: () => false, isFile: () => true }] : entries,
    readSource: async () => 'export { value } from "./value.mjs";'
  });
  expect(files[0]).toMatchObject({ kind: 'source', pureBarrel: true, lines: 1 });
});

test('reads defaults and validates explicit exemptions', async () => {
  await expect(readMonolithConfig('C:/repo', async () => JSON.stringify({}))).resolves.toEqual({ ...DEFAULT_LIMITS, exemptions: [] });
  await expect(readMonolithConfig('C:/repo', async () => JSON.stringify({ eliwareTest: { monolithLimits: { exemptions: [{ pattern: 'src/generated/*', reason: 'generated' }] } } }))).resolves.toMatchObject({ exemptions: [{ reason: 'generated' }] });
  expect(matchesExemption('src/generated/a.mjs', [{ pattern: 'src/generated/*', reason: 'generated' }])).toBe(true);
  await expect(readMonolithConfig('C:/repo', async () => JSON.stringify({ eliwareTest: { monolithLimits: { exemptions: [{ pattern: 'src/*', reason: '' }] } } }))).rejects.toThrow();
  await expect(readMonolithConfig('C:/repo', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).resolves.toEqual({ ...DEFAULT_LIMITS, exemptions: [] });
  await expect(readMonolithConfig('C:/repo', async () => { throw new Error('read failed'); })).rejects.toThrow('read failed');
  await expect(readMonolithConfig('C:/repo', async () => JSON.stringify({ eliwareTest: { monolithLimits: { source: 0 } } }))).rejects.toThrow();
});

test('finds violations and formats every diagnostic', async () => {
  const readDirectory = async (directory) => directory.endsWith('src') ? [{ name: 'large.mjs', isDirectory: () => false, isFile: () => true }] : [{ name: 'src', isDirectory: () => true }];
  const violations = await findMonolithViolations('C:/repo', { readDirectory, readSource: async () => `${'x\n'.repeat(301)}` });
  expect(violations).toHaveLength(1);
  expect(formatMonolithViolations(violations)).toContain(`exit ${MONOLITH_EXIT_CODE}`);
  expect(formatMonolithViolations([])).toContain('0 violations');
});

test('skips non-files and counts empty non-barrels', async () => {
  const files = await discoverMonolithFiles('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'link', isDirectory: () => false, isFile: () => false }, { name: 'empty.mjs', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true }],
    readSource: async () => ''
  });
  expect(files[0]).toMatchObject({ lines: 0, pureBarrel: false });
});
