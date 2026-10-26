import { expect, test } from "@jest/globals";
import { createActiveStarts } from "../../../../../../src/validation/shared/search/create/match-interval-index/active-starts.mjs";

test("returns the earliest active start that crosses a boundary", () => {
  const starts = createActiveStarts();
  starts.set(5, 12);
  starts.set(2, 8);
  expect(starts.earliestCrossing(4)).toBe(2);
  expect(starts.earliestCrossing(6)).toBe(2);
});

test("discards ended intervals and retains a start at the boundary", () => {
  const starts = createActiveStarts();
  starts.set(1, 3);
  starts.set(4, 9);
  expect(starts.earliestCrossing(4)).toBeNull();
  expect(starts.earliestCrossing(5)).toBe(4);
});

test("extends an existing start without adding a duplicate heap entry", () => {
  const starts = createActiveStarts();
  starts.set(2, 4);
  starts.set(2, 10);
  expect(starts.earliestCrossing(5)).toBe(2);
  expect(starts.earliestCrossing(10)).toBeNull();
});
