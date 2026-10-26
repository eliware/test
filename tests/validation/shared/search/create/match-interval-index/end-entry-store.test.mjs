import { expect, jest, test } from "@jest/globals";
import { createEndEntryStore } from "../../../../../../src/validation/shared/search/create/match-interval-index/end-entry-store.mjs";

test("keeps an extended interval when it discards an older end entry", () => {
  const ends = new Map([[2, 9]]);
  const discardInactive = jest.fn();
  const store = createEndEntryStore(ends, discardInactive);
  store.add(2, 5, 0);
  store.add(2, 9, 5);
  store.discardThrough(5);
  expect(ends).toEqual(new Map([[2, 9]]));
  expect(discardInactive).toHaveBeenCalledTimes(1);
  store.discardThrough(9);
  expect(ends).toEqual(new Map());
});

test("compacts many stale entries without losing the latest end", () => {
  const ends = new Map();
  const store = createEndEntryStore(ends, () => {});
  let previousEnd = 0;
  for (let end = 1; end <= 1_100; end += 1) {
    ends.set(1, end);
    store.add(1, end, previousEnd);
    previousEnd = end;
  }
  store.discardThrough(0);
  store.discardThrough(1_100);
  expect(ends).toEqual(new Map());
});

test("removes consumed entries after the head grows", () => {
  const ends = new Map();
  const store = createEndEntryStore(ends, () => {});
  for (let end = 1; end <= 1_100; end += 1) {
    ends.set(end, end);
    store.add(end, end, 0);
  }
  store.discardThrough(1_050);
  expect(ends.size).toBe(50);
  store.discardThrough(1_100);
  expect(ends.size).toBe(0);
});
