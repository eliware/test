import { checkWorkspacePolicy } from '../../../src/runner/workspace/policy.mjs';
test('accepts a clean workspace policy', async () => { await expect(checkWorkspacePolicy('C:/repo', () => {}, async () => [])).resolves.toBe(true); });
