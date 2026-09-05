import { validateOneFocusedPath } from '../../../src/testing/focused-path/validate-one-focused-path.mjs';

test('validates a focused file inside the workspace', async () => {
  await expect(validateOneFocusedPath('/repo', 'tests/a.test.mjs', async () => {}, async () => ({ isFile: () => true }), async (path) => path)).resolves.toBe('');
});
