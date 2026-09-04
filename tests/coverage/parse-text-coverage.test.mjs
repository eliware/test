import { parseCoverage } from '../../src/coverage/parse-text-coverage.mjs';

test('parses incomplete rows and ignores complete rows', () => {
  const text = '\u001b[32m foo.mjs | 100 | 100 | 100 | 100 |\u001b[0m\r\n bar.mjs | 90 | 100 | 100 | 100 |';
  expect(parseCoverage(text)).toEqual([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }]);
});

test('ignores headings, separators, and empty input', () => {
  expect(parseCoverage('File | % Stmts | % Branch | % Funcs | % Lines | Uncovered\n-----\nAll files | 100 | 100 | 100 | 100 |\n')).toEqual([]);
  expect(parseCoverage('')).toEqual([]);
});

test('retains raw counter rows and zero-valued coverage as gaps', () => {
  expect(parseCoverage('odd.mjs | 100% (1/2) | 100% (0/0) | 100% | 100% |')).toHaveLength(1);
  expect(parseCoverage('empty.mjs | 0 | 0 | 0 | 0 |')).toHaveLength(1);
  expect(parseCoverage('bad.mjs | not-a-number | 100 | 100 | 100 |')).toHaveLength(1);
});
