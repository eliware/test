import { createOrderedMatchStartIndex } from "../ordered-match-start-index.mjs";
import { createActiveStarts } from "./active-starts.mjs";
import { createEndEntryStore } from "./end-entry-store.mjs";

export function createMatchIntervals() {
  const matchEndsByStart = new Map();
  const orderedMatchStarts = createOrderedMatchStartIndex((start) => matchEndsByStart.has(start));
  const activeStarts = createActiveStarts();
  const endEntries = createEndEntryStore(matchEndsByStart, () =>
    orderedMatchStarts.discardInactive(),
  );

  function add(matches) {
    for (const { start, end } of matches) {
      const previousEnd = matchEndsByStart.get(start) ?? 0;
      if (end <= previousEnd) continue;
      if (previousEnd === 0) orderedMatchStarts.insert(start);
      matchEndsByStart.set(start, end);
      endEntries.add(start, end, previousEnd);
      activeStarts.set(start, end);
    }
  }

  function materialize(start, length) {
    const matches = [];
    matches.length = length + 1;
    for (const matchStart of orderedMatchStarts.range(start, start + length)) {
      const offset = matchStart - start;
      const end = matchEndsByStart.get(matchStart);
      if (end !== undefined) matches[offset] = end - start;
    }
    return matches;
  }

  function materializeEntries(start, length) {
    const matches = new Map();
    for (const matchStart of orderedMatchStarts.range(start, start + length)) {
      const end = matchEndsByStart.get(matchStart);
      matches.set(matchStart - start, end - start);
    }
    return matches;
  }

  return Object.freeze({
    add,
    earliestCrossing: activeStarts.earliestCrossing,
    materialize,
    materializeEntries,
    discardThrough: endEntries.discardThrough,
  });
}
