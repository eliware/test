import { checkSpecifications } from '../../../src/conventions/checks/specifications.mjs';

test('reports missing specification structure', () => {
  expect(checkSpecifications([], '', '')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('contains no Markdown') }), expect.objectContaining({ message: expect.stringContaining('out-of-scope') })]));
});

test('accepts linked specifications with an out-of-scope document', () => {
  expect(checkSpecifications(['scope.md', 'out-of-scope.md'], 'scope.md out-of-scope.md', 'out-of-scope.md')).toEqual([]);
  expect(checkSpecifications(['scope.md'], 'scope.md', '')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('out-of-scope') })]));
  expect(checkSpecifications(['scope.md', 'other.md'], 'scope.md', 'other.md')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('every specification') })]));
});
