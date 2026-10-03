import { expect, test } from "@jest/globals";
import {
  collectBalancedNumericTreeRange,
  collectBalancedNumericTreeValues,
} from "../../src/checks/collect-balanced-numeric-tree-values.mjs";

const tree = {
  value: 5,
  left: { value: 3, left: { value: 1 }, right: { value: 4 } },
  right: { value: 7, left: { value: 6 }, right: { value: 9 } },
};

test("collects tree values in order and returns no values for an empty tree", () => {
  expect(collectBalancedNumericTreeValues(tree)).toEqual([1, 3, 4, 5, 6, 7, 9]);
  expect(collectBalancedNumericTreeValues(null)).toEqual([]);
});

test("collects only inclusive range values and handles empty or reversed ranges", () => {
  expect(collectBalancedNumericTreeRange(tree, 4, 7)).toEqual([4, 5, 6, 7]);
  expect(collectBalancedNumericTreeRange(tree, 10, 12)).toEqual([]);
  expect(collectBalancedNumericTreeRange(null, 1, 2)).toEqual([]);
  expect(collectBalancedNumericTreeRange(tree, 7, 6)).toEqual([]);
});
