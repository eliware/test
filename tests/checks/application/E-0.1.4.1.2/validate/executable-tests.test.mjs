import { expect, test } from "@jest/globals";
import { validateExecutableTests } from "../../../../../src/checks/application/E-0.1.4.1.2/validate/executable-tests.mjs";

test("requires executable Jest tests for mirrored test files", async () => {
  const testFiles = [{ path: "tests/a.test.mjs", content: 'test("a", () => {});' }];
  expect(validateExecutableTests(testFiles)).toEqual([]);
});

test("rejects non-executable test files", () => {
  expect(
    validateExecutableTests([
      { path: "tests/empty.test.mjs", content: "" },
      {
        path: "tests/non-executable.test.mjs",
        content: 'import { value } from "../../src/a.mjs"; // test("comment", () => value);',
      },
    ]),
  ).toEqual([
    "tests/empty.test.mjs must declare an executable Jest test.",
    "tests/non-executable.test.mjs must declare an executable Jest test.",
  ]);
});

test("accepts an empty selection", () => {
  expect(validateExecutableTests([])).toEqual([]);
});
