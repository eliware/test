import { normalizeLintResult, lintFailed } from '../../../src/validation/lint/result.mjs';
test('normalizes lint results', () => { expect(normalizeLintResult({ output: 'ok' })).toMatchObject({ code: 1, output: 'ok' }); expect(lintFailed({ code: 0, output: '' })).toBe(false); });
