import { expect, test } from "@jest/globals";
import { shouldExecuteJest } from "../../src/orchestrators/should-execute-jest.mjs";

test.each([
  [true, ["general", "application"], true],
  [true, ["general", "library"], true],
  [true, ["general", "web"], false],
  [true, ["general", "documentation", "private"], false],
  [true, ["general", "workspace", "private"], false],
  [true, ["general", "infrastructure", "private"], false],
  [false, ["application"], false],
])("applies the Jest execution policy for %s and %j", (option, profiles, expected) => {
  expect(shouldExecuteJest(option, profiles)).toBe(expected);
});
