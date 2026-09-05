import { checkSpecifications } from '../../../src/conventions/checks/specifications.mjs';

test('reports missing specification structure', () => {
  expect(checkSpecifications([], '')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('contains no Markdown') })]));
});

test('accepts linked specifications with an out-of-scope document', () => {
  expect(checkSpecifications(['scope.md', 'exclusions.md'], 'scope.md exclusions.md')).toEqual([]);
  expect(checkSpecifications(['scope.md', 'other.md'], 'scope.md')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('every specification') })]));
});
