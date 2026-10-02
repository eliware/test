import { expect, test } from "@jest/globals";
import { createMatchIntervalIndex } from "../../src/checks/create-match-interval-index.mjs";

test("indexes match starts, selects the earliest crossing interval, and materializes a range", () => {
  const index = createMatchIntervalIndex();
  index.add([
    { start: 7, end: 9 },
    { start: 2, end: 10 },
    { start: 4, end: 12 },
  ]);

  expect(index.earliestCrossing(8)).toBe(2);
  expect(index.materialize(0, 8)).toEqual([0, 0, 10, 0, 12, 0, 0, 9, 0]);
});

test("updates duplicate starts and discards completed intervals without stale matches", () => {
  const index = createMatchIntervalIndex();
  index.add([
    { start: 1, end: 3 },
    { start: 4, end: 5 },
    { start: 1, end: 6 },
    { start: 5, end: 6 },
    { start: 1, end: 4 },
  ]);

  expect(index.earliestCrossing(4)).toBe(1);
  index.discardThrough(5);
  expect(index.materialize(0, 5)).toEqual([0, 6, 0, 0, 0, 6]);
  index.discardThrough(6);
  expect(index.materialize(0, 5)).toEqual([0, 0, 0, 0, 0, 0]);
  expect(index.earliestCrossing(6)).toBeNull();
});

test("compacts completed intervals from large ordered batches", () => {
  const index = createMatchIntervalIndex();
  index.add(Array.from({ length: 2048 }, (_, start) => ({ start, end: start + 1 })));

  index.discardThrough(1500);
  index.add([{ start: 2048, end: 2050 }]);
  index.discardThrough(2049);

  expect(index.materialize(2048, 1)).toEqual([2, 0]);
});

test("bounds stale interval entries when repeatedly extending one match", () => {
  const index = createMatchIntervalIndex();
  for (let end = 2; end < 5000; end += 1) index.add([{ start: 1, end }]);

  index.discardThrough(1);
  expect(index.earliestCrossing(2)).toBe(1);
  index.discardThrough(4999);
  expect(index.materialize(1, 0)).toEqual([0]);
});

test("repairs a heap when completed intervals are removed", () => {
  const index = createMatchIntervalIndex();
  index.add([
    { start: 0, end: 1 },
    { start: 1, end: 2 },
    { start: 2, end: 3 },
    { start: 3, end: 10 },
  ]);

  index.discardThrough(3);
  expect(index.materialize(0, 3)).toEqual([0, 0, 0, 10]);
});

test("selects the smaller right child while removing an expired start", () => {
  const index = createMatchIntervalIndex();
  index.add([
    { start: 0, end: 1 },
    { start: 3, end: 2 },
    { start: 1, end: 3 },
    { start: 4, end: 4 },
  ]);

  expect(index.earliestCrossing(1)).toBeNull();
  expect(index.earliestCrossing(2)).toBe(1);
});

test("returns no crossing for empty or boundary-starting matches", () => {
  const index = createMatchIntervalIndex();
  index.add([{ start: 3, end: 8 }]);
  expect(index.earliestCrossing(3)).toBeNull();
  expect(index.earliestCrossing(4)).toBe(3);
});

test("sifts the last heap value up when it is smaller than the chosen child", () => {
  const index = createMatchIntervalIndex();
  const starts = [0, 1, 2, 10, 11, 3, 4, 12, 13, 14, 15, 5, 6, 7, 8];
  index.add(starts.map((start) => ({ start, end: start === 2 ? 10 : 2 })));

  expect(index.earliestCrossing(3)).toBe(2);
});
