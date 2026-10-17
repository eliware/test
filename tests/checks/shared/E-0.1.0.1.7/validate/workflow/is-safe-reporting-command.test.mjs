import { expect, test } from "@jest/globals";
import { isSafeReportingCommand } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/is-safe-reporting-command.mjs";

test("allows literal echo and printf arguments with quoted shell characters", () => {
  expect(isSafeReportingCommand("echo 'Value $TOKEN & result > file'")).toBe(true);
  expect(isSafeReportingCommand('printf "%s & result > file"')).toBe(true);
  expect(isSafeReportingCommand("printf '%s' 'text'")).toBe(true);
  expect(isSafeReportingCommand("  echo ready")).toBe(true);
  expect(isSafeReportingCommand("echo 'one' 'two'")).toBe(true);
  expect(isSafeReportingCommand("echo")).toBe(true);
});

test("rejects shell expansion, control operators, and unsafe command syntax", () => {
  for (const command of [
    'echo "$TOKEN"',
    'echo "$(command)"',
    "echo 'literal' > output",
    "echo 'literal' && npm ci",
    "echo 'literal' | cat",
    "echo 'literal\\n'",
    'echo "unmatched',
    "echo'value'",
    "echo 'joined'text",
    "npm test",
    "echo first\necho second",
    null,
  ])
    expect(isSafeReportingCommand(command)).toBe(false);
});
