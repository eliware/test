import { normalizeLintResult, lintFailed } from '../../../src/validation/lint/result.mjs';
test('normalizes lint results', () => { expect(normalizeLintResult({ output: 'ok' })).toMatchObject({ code: 1, output: 'ok' }); expect(normalizeLintResult({ code: -1 })).toMatchObject({ code: 1 }); expect(lintFailed({ code: 0, output: '' })).toBe(false); });
