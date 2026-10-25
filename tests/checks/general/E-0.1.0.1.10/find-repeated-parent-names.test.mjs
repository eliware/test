import { expect, test } from "@jest/globals";
import { findRepeatedParentNames } from "../../../../src/checks/general/E-0.1.0.1.10/find-repeated-parent-names.mjs";

test("accepts a file with no parent folder", () => {
  expect(findRepeatedParentNames(["task-child.mjs", "src/task/task-child.js"])).toEqual([]);
});
