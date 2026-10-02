import { expect, test } from "@jest/globals";
import { createOrderedMatchStartIndex } from "../../src/checks/create-ordered-match-start-index.mjs";

test("inserts starts in sorted order and locates the first start at a boundary", () => {
  const index = createOrderedMatchStartIndex(() => true);
  index.insert(8);
  index.insert(2);
  index.insert(5);
  expect(index.values).toEqual([2, 5, 8]);
  expect(index.lowerBound(4)).toBe(1);
  expect(index.lowerBound(9)).toBe(3);
});

test("discards inactive starts and compacts a long inactive prefix", () => {
  const active = new Set([2048]);
  const index = createOrderedMatchStartIndex((start) => active.has(start));
  for (let start = 0; start < 2049; start += 1) index.insert(start);
  index.discardInactive();
  expect(index.values).toEqual([2048]);
  expect(index.lowerBound(2048)).toBe(0);
});

test("retains active starts while removing expired gaps", () => {
  const active = new Set([3, 8]);
  const index = createOrderedMatchStartIndex((start) => active.has(start));
  [1, 3, 5, 8].forEach(index.insert);
  index.discardInactive();
  expect(index.values.slice(index.lowerBound(0))).toEqual([3, 5, 8]);
});
