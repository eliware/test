import { formatIstanbulIgnoreFailure } from '../../../src/runner/diagnostics/failure.mjs';
test('formats all policy violation locations', () => { expect(formatIstanbulIgnoreFailure([{ file: 'src/a.mjs', line: 3 }])).toContain('src/a.mjs:3'); });
