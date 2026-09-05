import { resolveNpmArguments } from '../../src/application/resolve-npm-arguments.mjs';

test('builds shell-free npm arguments', () => {
  expect(resolveNpmArguments('audit', 'linux')).toEqual(['run', 'audit']);
  expect(resolveNpmArguments('audit', 'win32', 'C:/npm/npm-cli.js')).toEqual(['C:/npm/npm-cli.js', 'run', 'audit']);
  expect(resolveNpmArguments('audit', 'win32', 'C:/npm/npm.cmd')[1]).toBe('run');
});
