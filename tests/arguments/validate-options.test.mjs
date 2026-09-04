import { assertCompatibleArguments } from '../../src/arguments/validate-options.mjs';
test('rejects lint with runner arguments', () => { expect(() => assertCompatibleArguments(true, ['x'])).toThrow(); expect(() => assertCompatibleArguments(false, ['x'])).not.toThrow(); });
