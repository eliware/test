import { expect, test } from "@jest/globals";
import { createBalancedNumericTree } from "../../src/checks/create-balanced-numeric-tree.mjs";

test("keeps each insertion order balanced and sorted", () => {
  for (const values of [
    [1, 2, 3],
    [3, 2, 1],
    [3, 1, 2],
    [1, 3, 2],
  ]) {
    const tree = createBalancedNumericTree();
    values.forEach(tree.insert);
    tree.insert(2);
    expect(tree.values()).toEqual([1, 2, 3]);
    expect(tree.lowerBound(2)).toBe(1);
    expect(tree.lowerBound(4)).toBe(3);
  }
});

test("removes minimum values and handles an empty tree", () => {
  const tree = createBalancedNumericTree();
  expect(tree.minimum()).toBeUndefined();
  expect(tree.lowerBound(0)).toBe(0);
  tree.removeMinimum();
  [1, 2, 3, 4, 5, 6, 7].forEach(tree.insert);
  expect(tree.minimum()).toBe(1);
  tree.removeMinimum();
  expect(tree.minimum()).toBe(2);
  while (tree.minimum() !== undefined) tree.removeMinimum();
  expect(tree.values()).toEqual([]);
});
