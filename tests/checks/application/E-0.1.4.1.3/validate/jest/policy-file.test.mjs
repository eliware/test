import { expect, test } from "@jest/globals";
import { isJestPolicyFile } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/policy-file.mjs";

test.each([
  ["package.json", true],
  ["src/main.mjs", true],
  ["tests/check.test.ts", true],
  ["bin/run.sh", true],
  ["scripts/check.ps1", true],
  ["examples/demo.py", true],
  ["jest.config.mjs", true],
  [".babelrc", true],
  ["docs/guide.md", false],
  ["docs/configuration.md", false],
  ["assets/file.json", false],
])("selects Jest policy file %s", (path, expected) => {
  expect(isJestPolicyFile(path)).toBe(expected);
});
