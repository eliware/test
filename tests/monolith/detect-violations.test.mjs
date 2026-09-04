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
  expect(violations[0]).toMatchObject({ kind: 'source', threshold: 100 });
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

test('uses default filesystem collaborators', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'eliware-monolith-'));
  try {
    await writeFile(join(directory, 'package.json'), '{}');
    expect(await detectViolations(directory)).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
