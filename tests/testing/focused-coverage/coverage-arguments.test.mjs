import { coverageArguments } from '../../../src/testing/focused-coverage/coverage-arguments.mjs';
test('adds collection arguments', () => expect(coverageArguments(['src/a.mjs'])).toEqual(['--collectCoverageFrom', 'src/a.mjs']));
