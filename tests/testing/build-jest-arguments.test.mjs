import { buildJestArguments } from '../../src/testing/build-jest-arguments.mjs';

test('builds managed Jest arguments', () => {
  expect(buildJestArguments({ runnerArguments: ['-t', 'focused'], focusedCoverage: ['--collectCoverageFrom', 'src/a.mjs'], focusedPathMode: true }))
    .toEqual(['--coverage', '--runInBand', '--detectOpenHandles', '--silent', '--coverageReporters=text', '--coverageReporters=json', '--collectCoverageFrom', 'src/a.mjs', '--runTestsByPath', '-t', 'focused']);
});

test('supports diagnostic execution and timing output', () => {
  expect(buildJestArguments({ runInBand: false, timingOutput: 'results.json' })).toEqual([
    '--coverage', '--detectOpenHandles', '--silent', '--coverageReporters=text',
    '--coverageReporters=json', '--json', '--outputFile=results.json'
  ]);
  expect(buildJestArguments()).toEqual([
    '--coverage', '--runInBand', '--detectOpenHandles', '--silent',
    '--coverageReporters=text', '--coverageReporters=json'
  ]);
});

test('uses the isolated coverage directory supplied by the runner', () => {
  expect(buildJestArguments({ coverageDirectory: 'coverage/.eliware-test-coverage' })).toContainEqual('--coverageDirectory');
  expect(buildJestArguments({ coverageDirectory: 'coverage/.eliware-test-coverage' })).toContainEqual('coverage/.eliware-test-coverage');
});

test('rejects malformed argument collections', () => {
  expect(() => buildJestArguments({ runnerArguments: null })).toThrow(TypeError);
  expect(() => buildJestArguments({ focusedCoverage: null })).toThrow(TypeError);
});
