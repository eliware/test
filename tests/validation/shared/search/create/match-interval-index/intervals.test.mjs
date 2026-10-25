import { expect, test } from "@jest/globals";
import { createMatchIntervals } from "../../../../../../src/validation/shared/search/create/match-interval-index/intervals.mjs";

test("stores extended intervals and removes completed starts", () => {
  const intervals = createMatchIntervals();
  intervals.add([
    { start: 2, end: 4 },
    { start: 2, end: 6 },
    { start: 5, end: 8 },
  ]);

  expect(intervals.earliestCrossing(3)).toBe(2);
  expect(intervals.materializeEntries(0, 6)).toEqual(
    new Map([
      [2, 6],
      [5, 8],
    ]),
  );
  intervals.discardThrough(6);
  expect(Array.from(intervals.materialize(0, 6), (value) => value ?? 0)).toEqual([
    0, 0, 0, 0, 0, 8, 0,
  ]);
  expect(intervals.earliestCrossing(6)).toBe(5);
});
