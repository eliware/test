import { expect, test } from "@jest/globals";
import { validateApplicationTestToolScripts } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/commands/test-tool-scripts.mjs";

test.each([
  "jest",
  "npx --yes jest",
  "pnpm exec vitest",
  "node --experimental-test-coverage --test",
])("rejects an alternate test command in a package script: %s", (command) => {
  expect(validateApplicationTestToolScripts({ scripts: { test: command } })).toEqual([
    "package.json script test must not invoke a separate test or coverage tool.",
  ]);
});

test("ignores unrelated or non-string package script values", () => {
  expect(validateApplicationTestToolScripts()).toEqual([]);
  expect(
    validateApplicationTestToolScripts({ scripts: { start: "node app.mjs", invalid: 12 } }),
  ).toEqual([]);
});
