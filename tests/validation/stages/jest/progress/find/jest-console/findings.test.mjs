import { expect, test } from "@jest/globals";
import { findJestConsoleFindings } from "../../../../../../../src/validation/stages/jest/progress/find/jest-console/findings.mjs";

test("redacts console report errors and user output", () => {
  const secret = "console-secret";
  expect(
    findJestConsoleFindings(
      `report ${secret}`,
      [{ testFilePath: "tests/sample.test.mjs", type: "log", message: secret }],
      process.cwd(),
      [secret],
    ),
  ).toEqual(["report [REDACTED]", "console.log in tests/sample.test.mjs: [REDACTED]"]);
});

test("returns no findings when the report has no errors or console records", () => {
  expect(findJestConsoleFindings(undefined, [], process.cwd(), [])).toEqual([]);
});
