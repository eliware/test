import { checkGitignorePolicy } from '../../../src/workspace/policy/gitignore-policy.mjs';

test('validates the workspace and diagnostic writer', async () => {
  await expect(checkGitignorePolicy('', () => {}, async () => {})).rejects.toThrow(TypeError);
  await expect(checkGitignorePolicy('C:/repo', null, async () => {})).rejects.toThrow(TypeError);
});

test('warns when policy composition detects a missing .gitignore', async () => {
  const messages = [];
  await expect(checkGitignorePolicy('C:/repo', (message) => messages.push(message), async () => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toBe(true);
  expect(messages.join('')).toContain('.gitignore is missing');
});
