import { inspectWorkspace } from '../../src/workspace/inspect-workspace.mjs';

test('validates workspace and diagnostic writer', async () => {
  await expect(inspectWorkspace('', () => {}, async () => undefined, async () => [])).rejects.toThrow(TypeError);
  await expect(inspectWorkspace('C:/repo', null, async () => undefined, async () => [])).rejects.toThrow(TypeError);
});

test('accepts a clean workspace', async () => {
  await expect(inspectWorkspace('C:/repo', () => {}, async () => undefined, async () => [])).resolves.toBe(true);
});
