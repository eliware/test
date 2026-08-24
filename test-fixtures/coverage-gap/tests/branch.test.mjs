import { branch } from '../src/branch.mjs';

test('passes while leaving the false branch uncovered', () => {
  expect(branch(true)).toBe('taken');
});
