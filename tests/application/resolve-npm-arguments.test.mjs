import { resolveNpmArguments } from '../../src/application/resolve-npm-arguments.mjs';

test('builds shell-free npm arguments', () => {
  expect(resolveNpmArguments('audit')).toEqual(process.platform === 'win32'
    ? expect.arrayContaining(['run', 'audit'])
    : ['run', 'audit']);
  expect(resolveNpmArguments('audit', 'linux')).toEqual(['run', 'audit']);
  expect(resolveNpmArguments('audit', 'win32', 'C:/npm/npm-cli.js')).toEqual(['C:/npm/npm-cli.js', 'run', 'audit']);
  expect(resolveNpmArguments('audit', 'win32')).toEqual(expect.arrayContaining(['run', 'audit']));
  expect(resolveNpmArguments('audit', 'win32', undefined)).toEqual(expect.arrayContaining(['run', 'audit']));
  expect(resolveNpmArguments('audit', 'win32', '')).toEqual(expect.arrayContaining(['run', 'audit']));
  expect(resolveNpmArguments('audit', 'win32', 'C:/npm/npm.cmd')[1]).toBe('run');
  expect(resolveNpmArguments('audit', 'win32', null)).toEqual(expect.arrayContaining(['run', 'audit']));
  expect(resolveNpmArguments('audit', 'win32', { unexpected: true })).toEqual(expect.arrayContaining(['run', 'audit']));
});
