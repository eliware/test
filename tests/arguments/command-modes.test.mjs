import { terminalMode } from '../../src/arguments/command-modes.mjs';
test('recognizes version and help modes', () => { expect(terminalMode(['--version']).version).toBe(true); expect(terminalMode(['--help']).help).toBe(true); expect(terminalMode([])).toBeNull(); });
