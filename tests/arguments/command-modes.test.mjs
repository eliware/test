import { terminalMode } from '../../src/arguments/command-modes.mjs';
test('recognizes version and help modes', () => { expect(terminalMode(['--version']).version).toBe(true); expect(terminalMode(['--help']).help).toBe(true); expect(terminalMode([])).toBeNull(); });
test('terminal flags retain precedence over mixed invocations', () => {
  expect(terminalMode(['tests/example.test.mjs', '--help'])).toEqual({ help: true, lint: false, runnerArguments: [] });
  expect(terminalMode(['--version', '--lint'])).toEqual({ version: true, lint: false, runnerArguments: [] });
});
