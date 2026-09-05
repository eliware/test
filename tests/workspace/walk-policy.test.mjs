import { shouldTraverseDirectory, sortWorkspaceEntries, WALK_LIMITS } from '../../src/workspace/walk-policy.mjs';

test('defines deterministic traversal policy', () => {
  expect(WALK_LIMITS.maxFiles).toBeGreaterThan(0);
  expect(shouldTraverseDirectory('node_modules')).toBe(false);
  expect(sortWorkspaceEntries([{ name: 'b' }, { name: 'a' }]).map(({ name }) => name)).toEqual(['a', 'b']);
});
