import { assertExitCode } from '../../src/public/exit-contract.mjs';
test('accepts integer exit codes', () => { expect(assertExitCode(0, 'run')).toBe(0); expect(() => assertExitCode('0', 'run')).toThrow(); });
