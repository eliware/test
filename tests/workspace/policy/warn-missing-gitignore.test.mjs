import { jest } from '@jest/globals';
import { warnIfMissingGitignore } from '../../../src/workspace/policy/warn-missing-gitignore.mjs';

test('warns when gitignore is missing', async () => {
  const write = jest.fn();
  const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await warnIfMissingGitignore('repo', write, async () => { throw error; });
  expect(write).toHaveBeenCalledWith(expect.stringContaining('.gitignore is missing'));
});

test('does not warn when gitignore exists', async () => {
  const write = jest.fn();
  await warnIfMissingGitignore('repo', write, async () => {});
  expect(write).not.toHaveBeenCalled();
});

test('uses the default filesystem access check', async () => {
  await expect(warnIfMissingGitignore(process.cwd(), jest.fn())).resolves.toBeUndefined();
});

test('propagates unexpected gitignore errors', async () => {
  await expect(warnIfMissingGitignore('repo', jest.fn(), async () => {
    throw new Error('denied');
  })).rejects.toThrow('denied');
});
