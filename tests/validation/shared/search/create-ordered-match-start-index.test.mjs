import { expect, test } from "@jest/globals";
import { createOrderedMatchStartIndex } from "../../../../src/validation/shared/search/create-ordered-match-start-index.mjs";

test("inserts starts in sorted order and locates the first start at a boundary", () => {
  const index = createOrderedMatchStartIndex(() => true);
  index.insert(8);
  index.insert(2);
  index.insert(5);
  expect(index.values).toEqual([2, 5, 8]);
  expect(index.lowerBound(4)).toBe(1);
  expect(index.lowerBound(9)).toBe(3);
  expect(index.range(3, 8)).toEqual([5, 8]);
});

test("handles large unordered batches, duplicate starts, and prefix removal", () => {
  const active = new Set([1, 2048]);
  const index = createOrderedMatchStartIndex((start) => active.has(start));
  for (let start = 2048; start >= 0; start -= 1) index.insert(start);
  index.insert(1024);
  expect(index.values).toHaveLength(2049);
  expect(index.lowerBound(1024)).toBe(1024);
  index.discardInactive();
  expect(index.values[0]).toBe(1);
  expect(index.values).toHaveLength(2048);
  expect(index.lowerBound(2)).toBe(1);
  index.discardInactive();
  expect(index.values).toHaveLength(2048);
});

test("keeps balanced order for each single and double rotation", () => {
  for (const starts of [
    [1, 2, 3],
    [3, 2, 1],
    [3, 1, 2],
    [1, 3, 2],
  ]) {
    const index = createOrderedMatchStartIndex(() => true);
    starts.forEach(index.insert);
    expect(index.values).toEqual([1, 2, 3]);
  }
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

test("handles empty and fully discarded indexes", () => {
  const index = createOrderedMatchStartIndex(() => false);
  expect(index.lowerBound(0)).toBe(0);
  index.discardInactive();
  index.insert(1);
  index.discardInactive();
  expect(index.values).toEqual([]);
});
