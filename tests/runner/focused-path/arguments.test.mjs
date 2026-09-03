import { isTestPath, positionalArguments } from '../../../src/runner/focused-path/arguments.mjs';
test('classifies test paths and extracts positional arguments', () => { expect(isTestPath('tests/a.test.mjs')).toBe(true); expect(positionalArguments(['--config', 'x', 'tests/a.test.mjs'])).toEqual(['tests/a.test.mjs']); });
