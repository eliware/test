import { filterMonolithViolations } from '../../src/monolith/filter.mjs';
test('filters and annotates violations', () => expect(filterMonolithViolations([{ file: 'src/a.mjs', kind: 'source', lines: 11 }], { source: 10, test: 20, exemptions: [] })[0].threshold).toBe(10));
test('excludes generated, barrel, exempt, and below-threshold files', () => {
  const files = [
    { file: 'src/generated.mjs', kind: 'source', lines: 100, generated: true, pureBarrel: false },
    { file: 'src/index.mjs', kind: 'source', lines: 100, generated: false, pureBarrel: true },
    { file: 'src/exempt.mjs', kind: 'source', lines: 100, generated: false, pureBarrel: false },
    { file: 'src/small.mjs', kind: 'source', lines: 9, generated: false, pureBarrel: false },
  ];
  expect(filterMonolithViolations(files, { source: 10, test: 20, exemptions: [{ pattern: 'src/exempt.mjs' }] })).toEqual([]);
});
