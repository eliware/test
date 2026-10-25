import { createMatchIntervals } from "./match-interval-index/intervals.mjs";
import { isValidMatchInterval } from "./is-valid-match-interval.mjs";

const MAX_MATCH_WINDOW = 1_000_000;

export function createMatchIntervalIndex() {
  const intervals = createMatchIntervals();

  function add(matches) {
    if (!Array.isArray(matches) || !Array.from(matches).every(isValidMatchInterval))
      throw new TypeError("Match intervals must have safe non-negative start and end offsets");
    intervals.add(matches);
  }

  function materialize(start, length) {
    validateWindow(start, length);
    return intervals.materialize(start, length);
  }

  function materializeEntries(start, length) {
    validateWindow(start, length);
    return intervals.materializeEntries(start, length);
  }

  return Object.freeze({
    add,
    earliestCrossing: intervals.earliestCrossing,
    materialize,
    materializeEntries,
    discardThrough: intervals.discardThrough,
  });
}

function validateWindow(start, length) {
  if (
    !Number.isSafeInteger(start) ||
    start < 0 ||
    !Number.isSafeInteger(length) ||
    length < 0 ||
    length > MAX_MATCH_WINDOW ||
    !Number.isSafeInteger(start + length)
  )
    throw new RangeError(`Match window must be between 0 and ${MAX_MATCH_WINDOW} characters.`);
}
