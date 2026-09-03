import { checkGitignorePolicy, warnIfMissingGitignore } from '../../../src/workspace/policy/gitignore-policy.mjs';

test('validates the workspace and diagnostic writer', async () => {
  await expect(checkGitignorePolicy('', () => {}, async () => {})).rejects.toThrow(TypeError);
  await expect(checkGitignorePolicy('C:/repo', null, async () => {})).rejects.toThrow(TypeError);
});

test('warns when .gitignore is absent', async () => {
  const messages = [];
  await expect(checkGitignorePolicy('C:/repo', (message) => messages.push(message), async () => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toBe(true);
  expect(messages.join('')).toContain('.gitignore is missing');
});

test('does not warn when .gitignore exists and propagates unexpected errors', async () => {
  const messages = [];
  await expect(warnIfMissingGitignore(process.cwd(), () => {})).resolves.toBeUndefined();
  await expect(warnIfMissingGitignore('C:/repo', (message) => messages.push(message), async () => {})).resolves.toBeUndefined();
  await expect(warnIfMissingGitignore('C:/repo', () => {}, async () => { throw new Error('denied'); })).rejects.toThrow('denied');
});
