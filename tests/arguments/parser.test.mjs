import { parseArguments } from '../../src/arguments/parser.mjs';

test('parses wrapper options and forwards Jest arguments', () => {
  expect(parseArguments(['--ignore-100x4', '--', '-t', 'focused'])).toEqual({ lint: false, ignoreCoverage: true, runnerArguments: ['-t', 'focused'] });
});
test.todo('implement parser unit tests');
