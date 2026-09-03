import { detectViolations } from '../../src/monolith/detect-violations.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

test('validates cwd and options', async () => {
  await expect(detectViolations('')).rejects.toThrow(TypeError);
  await expect(detectViolations('C:/repo', null)).rejects.toThrow(TypeError);
});

test('ignores supported files outside src and propagates configuration errors', async () => {
  await expect(detectViolations('C:/repo', {
    readFilePath: async () => { throw new Error('invalid package'); },
    readDirectory: async (directory) => directory === 'C:\\repo'
      ? [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }]
      : [],
    readSource: async () => 'export const value = 1;'
  })).rejects.toThrow('invalid package');
  let visitedRoot = false;
  await expect(detectViolations('C:/repo', {
    readFilePath: async () => '{}',
    readDirectory: async () => {
      if (visitedRoot) return [];
      visitedRoot = true;
      return [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }];
    },
    readSource: async () => 'export const value = 1;'
  })).resolves.toEqual([]);
});

test('skips excluded directories and classifies test files', async () => {
  let calls = 0;
  await expect(detectViolations('C:/repo', {
    readFilePath: async () => '{}',
    readDirectory: async () => {
      calls += 1;
      if (calls === 1) return [
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: 'tests', isDirectory: () => true, isFile: () => false }
      ];
      if (calls === 2) return [{ name: 'sample.test.mjs', isDirectory: () => false, isFile: () => true }];
      return [];
    },
    readSource: async () => 'test();'
  })).resolves.toEqual([]);
});

test('rejects invalid monolith configuration values', async () => {
  await expect(detectViolations('C:/repo', { readFilePath: async () => '{"eliwareTest":{"monolithLimits":{"source":0}}}', readDirectory: async () => [] }))
    .rejects.toThrow('positive integers');
  await expect(detectViolations('C:/repo', { readFilePath: async () => '{"eliwareTest":{"monolithLimits":{"exemptions":[{"pattern":"x","reason":""}]}}}', readDirectory: async () => [] }))
    .rejects.toThrow('exemption');
});

test('uses default filesystem collaborators', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'eliware-monolith-'));
  try {
    await writeFile(join(directory, 'package.json'), '{}');
    expect(await detectViolations(directory)).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
