import { resolveNpmCommand } from '../../src/application/resolve-npm-command.mjs';

test('resolves npm for supported platforms', () => {
  expect(resolveNpmCommand('linux')).toBe('npm');
  expect(resolveNpmCommand('win32')).toBe(process.execPath);
});
