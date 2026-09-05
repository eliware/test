import { resolveCoverageEvidence } from '../../src/coverage/resolve-coverage-evidence.mjs';

const text = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\ngap.mjs | 90 | 100 | 100 | 90 | 2';

test('prefers a fresh usable JSON report', () => {
  expect(resolveCoverageEvidence([{ usable: true, fresh: true, json: { 'src/a.mjs': { statementMap: {}, s: {}, b: {}, f: {} } } }], '', () => {})).toEqual([]);
});

test('falls back to text and reports freshness or malformed failures', () => {
  expect(resolveCoverageEvidence([{ malformed: true, fresh: false, name: 'coverage.json' }], text, () => {})).toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
  expect(() => resolveCoverageEvidence([{ usable: true, freshnessAvailable: false }], text, () => {}, 1)).toThrow('freshness unavailable');
  expect(() => resolveCoverageEvidence([{ malformed: true, fresh: true, name: 'coverage.json' }], '', () => {}, 1)).toThrow('malformed');
});

test('rejects any candidate whose freshness cannot be verified', () => {
  expect(() => resolveCoverageEvidence([{ malformed: true, fresh: false, freshnessAvailable: false, name: 'coverage.json' }], text, () => {}, 1))
    .toThrow('freshness unavailable');
});
