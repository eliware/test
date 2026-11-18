import { expect, test } from "@jest/globals";
import validateJestPolicyFiles from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/source/validate-files.mjs";
test("applies policy checks to each collected file", () => {
  const errors = [];
  expect(
    validateJestPolicyFiles(
      [{ path: "src/run.mjs", content: 'import "vitest";' }],
      errors,
      {},
      false,
    ),
  ).toEqual(["src/run.mjs must not import or invoke a test runner or coverage tool."]);
});
