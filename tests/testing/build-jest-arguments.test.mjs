import { buildJestArguments } from '../../src/testing/build-jest-arguments.mjs';

test('builds managed Jest arguments', () => {
  expect(buildJestArguments({ runnerArguments: ['-t', 'focused'], focusedCoverage: ['--collectCoverageFrom', 'src/a.mjs'], focusedPathMode: true }))
    .toEqual(['--coverage', '--runInBand', '--detectOpenHandles', '--silent', '--coverageReporters=text', '--coverageReporters=json', '--collectCoverageFrom', 'src/a.mjs', '--runTestsByPath', '-t', 'focused']);
});
