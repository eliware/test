import { inspectWorkspace } from '../../src/workspace/inspect-workspace.mjs';

test('validates workspace and diagnostic writer', async () => {
  await expect(inspectWorkspace('', () => {}, async () => undefined, async () => [])).rejects.toThrow(TypeError);
  await expect(inspectWorkspace('C:/repo', null, async () => undefined, async () => [])).rejects.toThrow(TypeError);
});

test('rejects workspace policy violations', async () => {
  const messages = [];
  await expect(inspectWorkspace('C:/repo', (message) => messages.push(message), async () => undefined, async () => [{ file: 'src/a.mjs', line: 3 }]))
    .resolves.toBe(false);
  expect(messages.join('')).toContain('src/a.mjs:3');
});

test('accepts a clean workspace', async () => {
  await expect(inspectWorkspace('C:/repo', () => {}, async () => undefined, async () => [])).resolves.toBe(true);
});

test('uses default policy collaborators for a clean fixture workspace', async () => {
  await expect(inspectWorkspace('test-fixtures/exclusions', () => {})).resolves.toBe(true);
});
