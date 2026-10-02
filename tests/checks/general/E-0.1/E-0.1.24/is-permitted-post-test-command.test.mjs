import { expect, test } from "@jest/globals";
import { isPermittedPostTestCommand } from "../../../../../src/checks/general/E-0.1/E-0.1.24/is-permitted-post-test-command.mjs";

test("permits commands only when they follow the selected npm test step and policy is enabled", () => {
  expect(isPermittedPostTestCommand(3, 2, true)).toBe(true);
  expect(isPermittedPostTestCommand(2, 2, true)).toBe(false);
  expect(isPermittedPostTestCommand(3, -1, true)).toBe(false);
  expect(isPermittedPostTestCommand(3, 2, false)).toBe(false);
});
