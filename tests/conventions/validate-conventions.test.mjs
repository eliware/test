import { validateConventions } from '../../src/conventions/validate-conventions.mjs';
import { resolve } from 'node:path';

test('validates the current repository convention set', async () => {
  const messages = [];
  await expect(validateConventions({ cwd: process.cwd(), write: (message) => messages.push(message), accessPath: async () => {}, readFilePath: undefined })).resolves.toBe(true);
  expect(messages).toEqual([]);
});

test('reports missing structure deterministically', async () => {
  const messages = [];
  await expect(validateConventions({ cwd: 'repo', write: (message) => messages.push(message), accessPath: async () => { throw new Error('missing'); }, readFilePath: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, readDirectory: async () => [] })).resolves.toBe(false);
  expect(messages[0]).toContain('structure:');
});

test('reads exact path exceptions from package metadata', async () => {
  const realRead = (await import('node:fs/promises')).readFile;
  const packagePath = resolve(process.cwd(), 'package.json');
  const readFilePath = async (path, encoding) => path === packagePath
    ? JSON.stringify({ eliwareTest: { conventions: { exceptions: ['examples'] } } })
    : realRead(path, encoding);
  await expect(validateConventions({ cwd: process.cwd(), write: () => {}, accessPath: async () => {}, readFilePath })).resolves.toBe(false);
});

test('reports bounded traversal failures as convention diagnostics', async () => {
  const messages = [];
  let calls = 0;
  const readDirectory = async () => {
    calls += 1;
    return calls > 105 ? [] : [{ name: 'nested', isDirectory: () => true, isFile: () => false }];
  };
  await expect(validateConventions({
    cwd: 'repo', write: (message) => messages.push(message), accessPath: async () => {},
    readFilePath: async () => '{}', readDirectory,
  })).resolves.toBe(false);
  expect(messages.join('')).toContain('workspace traversal failed');
});

test('handles a repository using the root SPEC.md fallback', async () => {
  await expect(validateConventions({
    cwd: 'repo', write: () => {}, accessPath: async () => {},
    readFilePath: async () => '{}', readDirectory: async () => [],
  })).resolves.toBe(false);
});
