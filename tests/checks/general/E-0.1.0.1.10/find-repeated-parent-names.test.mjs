import { expect, test } from "@jest/globals";
import { findRepeatedParentNames } from "../../../../src/checks/general/E-0.1.0.1.10/find-repeated-parent-names.mjs";

test("finds a parent name repeated in a source or test filename", () => {
  expect(
    findRepeatedParentNames([
      "src/task/task-child.mjs",
      "tests/task/task-child.test.mjs",
      "src/task/child.mjs",
      "src/task/child.js",
    ]),
  ).toEqual(["src/task/task-child.mjs", "tests/task/task-child.test.mjs"]);
});

test("accepts a file with no parent folder", () => {
  expect(findRepeatedParentNames(["task-child.mjs"])).toEqual([]);
});
