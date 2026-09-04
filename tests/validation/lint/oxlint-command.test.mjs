import { buildOxlintArguments } from '../../../src/validation/lint/oxlint-command.mjs';
test('builds strict oxlint arguments', () => expect(buildOxlintArguments()).toEqual(expect.arrayContaining(['oxlint', '--deny-warnings', '.'])));
