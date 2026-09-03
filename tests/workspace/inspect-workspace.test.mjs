import { inspectWorkspace } from '../../src/workspace/inspect-workspace.mjs';

test('rejects workspace policy violations', async () => {
  const messages = [];
  await expect(inspectWorkspace('C:/repo', (message) => messages.push(message), async () => undefined, async () => [{ file: 'src/a.mjs', line: 3 }]))
    .resolves.toBe(false);
  expect(messages.join('')).toContain('src/a.mjs:3');
});

test('accepts a clean workspace', async () => {
  await expect(inspectWorkspace('C:/repo', () => {}, async () => undefined, async () => [])).resolves.toBe(true);
});
