import { isFocusedTestPath } from '../../src/arguments/focused-path-matcher.mjs';
test('matches concrete test paths only', () => { expect(isFocusedTestPath('tests/unit.test.mjs')).toBe(true); expect(isFocusedTestPath('src/a.mjs')).toBe(false); expect(isFocusedTestPath('tests/*.test.mjs')).toBe(false); });
