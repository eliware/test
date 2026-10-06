import { expect, test } from "@jest/globals";
import { createBalancedNumericTree } from "../../src/orchestration/create-balanced-numeric-tree.mjs";

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

test("rejects non-finite insertion and lower-bound values without corrupting the tree", () => {
  const tree = createBalancedNumericTree();
  tree.insert(4);
  tree.insert(2);
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    expect(() => tree.insert(value)).toThrow("values must be finite numbers");
    expect(() => tree.lowerBound(value)).toThrow("values must be finite numbers");
  }
  expect(tree.values()).toEqual([2, 4]);
  expect(tree.lowerBound(3)).toBe(1);
});

test("returns only values in an inclusive range without traversing unrelated branches", () => {
  const tree = createBalancedNumericTree();
  [4, 2, 6, 1, 3, 5, 7].forEach(tree.insert);
  expect(tree.range(3, 5)).toEqual([3, 4, 5]);
  expect(tree.range(8, 9)).toEqual([]);
  expect(tree.range(6, 5)).toEqual([]);
  expect(tree.range(-2, 1)).toEqual([1]);
  expect(() => tree.range(Number.NaN, 1)).toThrow("values must be finite numbers");
  expect(() => tree.range(1, Number.POSITIVE_INFINITY)).toThrow("values must be finite numbers");
});
