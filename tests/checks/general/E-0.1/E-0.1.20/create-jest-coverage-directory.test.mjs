import { expect, test } from "@jest/globals";
import { createJestCoverageDirectory } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-coverage-directory.mjs";

test("creates unique run-scoped coverage paths", () => {
  const first = createJestCoverageDirectory();
  const second = createJestCoverageDirectory();
  expect(first).not.toBe(second);
  expect(first).toMatch(/[\\/]eliware-test[\\/]coverage-/u);
  expect(second).toMatch(/[\\/]eliware-test[\\/]coverage-/u);
});
