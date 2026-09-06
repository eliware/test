import { detectViolations } from '../../src/monolith/detect-violations.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('returns oversized source files', async () => {
  const root = resolve('repo');
  const violations = await detectViolations(root, {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'large.mjs', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true, isFile: () => false }],
    readSource: async () => `${'x\n'.repeat(301)}`
  });
  expect(violations[0]).toMatchObject({ kind: 'source', threshold: 100 });
});

test('reports oversized test files using the test threshold', async () => {
  const root = resolve('repo');
  const violations = await detectViolations(root, {
    readDirectory: async (directory) => directory === root
      ? [{ name: 'tests', isDirectory: () => true, isFile: () => false }]
      : [{ name: 'large.test.mjs', isDirectory: () => false, isFile: () => true }],
    readSource: async () => `${'test\n'.repeat(201)}`,
  });
  expect(violations).toEqual([expect.objectContaining({
    file: 'tests/large.test.mjs',
    kind: 'test',
    lines: 201,
    threshold: 200,
  })]);
});

test('handles empty directories and non-file entries', async () => {
  await expect(detectViolations(resolve('repo'), {
    readDirectory: async () => [{ name: 'link', isDirectory: () => false, isFile: () => false }]
  })).resolves.toEqual([]);
});

test('validates cwd and options', async () => {
  await expect(detectViolations('')).rejects.toThrow(TypeError);
  await expect(detectViolations(resolve('repo'), null)).rejects.toThrow(TypeError);
});

test('ignores supported files outside src and propagates configuration errors', async () => {
  const root = resolve('repo');
  await expect(detectViolations(root, {
    readFilePath: async () => { throw new Error('invalid package'); },
    readDirectory: async (directory) => directory === root
      ? [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }]
      : [],
    readSource: async () => 'export const value = 1;'
  })).rejects.toThrow('invalid package');
  let visitedRoot = false;
  await expect(detectViolations(root, {
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
