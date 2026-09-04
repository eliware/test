import { assertChildProcessArguments } from '../../src/processes/child-validation.mjs';
test('validates child process inputs', () => { expect(() => assertChildProcessArguments('node', [], {})).not.toThrow(); expect(() => assertChildProcessArguments('', [], {})).toThrow(); });
