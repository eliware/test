import { parseTextReport } from '../../src/coverage/parse-text-report.mjs';

const header = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #';

test('requires report text', () => {
  expect(() => parseTextReport(null)).toThrow(TypeError);
});

test('parses incomplete rows and ignores complete rows', () => {
  const report = `${header}\ncomplete.mjs | 100 | 100 | 100 | 100 |\ngap.mjs | 90 | 100 | 100 | 90 | 4`;
  expect(parseTextReport(report)).toEqual([{ file: 'gap.mjs', metrics: ['90', '100', '100', '90'] }]);
});

test('supports ANSI and CRLF report output', () => {
  const report = `${header}\r\n\u001b[31mgap.mjs\u001b[0m | 100 | 99 | 100 | 100 |`;
  expect(parseTextReport(report)).toHaveLength(1);
});
