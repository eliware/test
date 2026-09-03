import { checkGitignorePolicy } from '../../../src/workspace/policy/gitignore-policy.mjs';

test('warns when .gitignore is absent', async () => {
  const messages = [];
  await expect(checkGitignorePolicy('C:/repo', (message) => messages.push(message), async () => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toBe(true);
  expect(messages.join('')).toContain('.gitignore is missing');
});
