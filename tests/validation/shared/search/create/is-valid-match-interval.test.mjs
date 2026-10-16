import { expect, test } from "@jest/globals";
import { isValidMatchInterval } from "../../../../../src/validation/shared/search/create/is-valid-match-interval.mjs";

test("accepts safe non-negative intervals with a positive length", () => {
  expect(isValidMatchInterval({ start: 0, end: 1 })).toBe(true);
  expect(isValidMatchInterval({ start: 5, end: 9 })).toBe(true);
});

test.each([null, {}, { start: -1, end: 1 }, { start: 1, end: 1 }, { start: 1, end: 0 }])(
  "rejects invalid intervals: %j",
  (interval) => expect(isValidMatchInterval(interval)).toBe(false),
);
