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

test('matches Windows-style exemption patterns against normalized paths', () => {
  expect(filterMonolithViolations(
    [{ file: 'src/tools/large.mjs', kind: 'source', lines: 11 }],
    { source: 10, test: 20, exemptions: [{ pattern: 'src\\tools\\*.mjs' }] },
  )).toEqual([]);
});

test('matches Windows exemptions without case sensitivity', () => {
  expect(filterMonolithViolations(
    [{ file: 'C:/Repo/Large.mjs', kind: 'source', lines: 11 }],
    { source: 10, test: 20, exemptions: [{ pattern: 'c:\\repo\\large.mjs' }] },
  )).toEqual([]);
});

test('treats regex metacharacters in exemptions as literal glob text', () => {
  expect(filterMonolithViolations(
    [{ file: 'src/a+b[1].mjs', kind: 'source', lines: 11 }],
    { source: 10, test: 20, exemptions: [{ pattern: 'src/a+b[1].mjs' }] },
  )).toEqual([]);
});

test('handles wildcard boundaries and nonmatching exemption parts', () => {
  const file = [{ file: 'src/a+b[1].mjs', kind: 'source', lines: 11 }];
  expect(filterMonolithViolations(file, { source: 10, test: 20, exemptions: [{ pattern: 'src/*' }] })).toEqual([]);
  expect(filterMonolithViolations(file, { source: 10, test: 20, exemptions: [{ pattern: '*a+b*' }] })).toEqual([]);
  expect(filterMonolithViolations(file, { source: 10, test: 20, exemptions: [{ pattern: 'other/*' }] })).toHaveLength(1);
  expect(filterMonolithViolations(file, { source: 10, test: 20, exemptions: [{ pattern: 'src/*missing' }] })).toHaveLength(1);
  expect(filterMonolithViolations(file, { source: 10, test: 20, exemptions: [{ pattern: '*nomatch*' }] })).toHaveLength(1);
});
