import { hasLintWarnings } from '../../../src/runner/diagnostics/formatter.mjs';
test('detects warnings after ANSI removal', () => { expect(hasLintWarnings('\u001b[33mwarning:\u001b[0m unused')).toBe(true); expect(hasLintWarnings('all clear')).toBe(false); });
