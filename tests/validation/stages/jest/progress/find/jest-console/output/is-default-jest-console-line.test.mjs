import { expect, test } from "@jest/globals";
import isDefaultJestConsoleLine from "../../../../../../../../src/validation/stages/jest/progress/find/jest-console/output/is-default-jest-console-line.mjs";

test("matches console output by unknown suite and message lines", () => {
  expect(
    isDefaultJestConsoleLine(
      { suite: "unknown test suite", line: "useful message" },
      [{ message: "first\nuseful message", testFilePath: "tests/a.test.mjs" }],
      ".",
    ),
  ).toBe(true);
  expect(
    isDefaultJestConsoleLine(
      { suite: "tests/other.test.mjs", line: "different" },
      [{ message: "message", testFilePath: "tests/a.test.mjs" }],
      ".",
    ),
  ).toBe(false);
  expect(
    isDefaultJestConsoleLine(
      { suite: "unknown test suite", line: "missing message" },
      [{ message: "different message", testFilePath: "tests/a.test.mjs" }],
      ".",
    ),
  ).toBe(false);
  expect(
    isDefaultJestConsoleLine(
      { suite: "tests/missing.test.mjs", line: "console.log" },
      [{ testFilePath: null, message: "anything" }],
      ".",
    ),
  ).toBe(false);
});
