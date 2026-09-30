import { expect, test } from "@jest/globals";
import { hasDirectCommandToolUse } from "../../../../../src/checks/general/E-0.1/E-0.1.3/has-direct-command-tool-use.mjs";

test("detects commands in executable YAML fields", () => {
  expect(hasDirectCommandToolUse("workflow.yml", "steps:\n  - run: npx oxlint .\n")).toBe(true);
  expect(hasDirectCommandToolUse("deploy.yaml", "command: prettier --check .\n")).toBe(true);
});

test("ignores command examples in non-executable YAML values", () => {
  expect(
    hasDirectCommandToolUse("workflow.yml", 'description: |\n  Example: run "jest --runInBand"\n'),
  ).toBe(false);
});

test("detects executable shell lines and ignores prose", () => {
  expect(hasDirectCommandToolUse("validate.sh", "npx prettier --write .\n")).toBe(true);
  expect(hasDirectCommandToolUse("validate.sh", 'echo "do not run jest directly"\n')).toBe(false);
});
