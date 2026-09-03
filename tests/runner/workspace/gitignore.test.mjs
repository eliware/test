import { warnIfMissingGitignore } from '../../../src/runner/workspace/gitignore.mjs';
test('warns when gitignore is absent', async () => { const messages = []; await warnIfMissingGitignore('C:/repo', (message) => messages.push(message), async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }); expect(messages.join('')).toContain('.gitignore'); });
