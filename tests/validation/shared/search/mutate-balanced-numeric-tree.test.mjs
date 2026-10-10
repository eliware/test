import { expect, test } from "@jest/globals";
import {
  insertBalancedNumericTreeNode,
  removeBalancedNumericTreeMinimum,
} from "../../../../src/validation/shared/search/mutate-balanced-numeric-tree.mjs";

const keepNode = (node) => node;

test("inserts unique values iteratively and skips duplicates", () => {
  let root = null;
  for (const value of [4, 2, 6, 1, 3, 5, 7, 4])
    root = insertBalancedNumericTreeNode(root, value, keepNode);
  expect(root).toMatchObject({ value: 4, left: { value: 2 }, right: { value: 6 } });
});

test("removes the minimum node and retains the rest of the tree", () => {
  const root = { value: 2, left: { value: 1, left: null, right: null }, right: null };
  expect(removeBalancedNumericTreeMinimum(root, keepNode)).toBe(root);
  expect(root.left).toBeNull();
});
