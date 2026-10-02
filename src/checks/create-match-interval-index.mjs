import { createNumericMinHeap } from "./create-numeric-min-heap.mjs";
import { createOrderedMatchStartIndex } from "./create-ordered-match-start-index.mjs";

export function createMatchIntervalIndex() {
  const matchEndsByStart = new Map();
  const orderedMatchStarts = createOrderedMatchStartIndex((start) => matchEndsByStart.has(start));
  const activeEndsByStart = new Map();
  const activeStarts = createNumericMinHeap();
  const endEntries = [];
  let endEntryHead = 0;
  let staleEndEntryCount = 0;

  function add(matches) {
    if (!Array.isArray(matches) || !Array.from(matches).every(isValidInterval))
      throw new TypeError("Match intervals must have safe non-negative start and end offsets");
    for (const { start, end } of matches) {
      const previousEnd = matchEndsByStart.get(start) ?? 0;
      if (end <= previousEnd) continue;
      if (previousEnd === 0) orderedMatchStarts.insert(start);
      if (previousEnd > 0) staleEndEntryCount += 1;
      matchEndsByStart.set(start, end);
      // The matcher emits intervals in increasing end order, so this index is a queue.
      endEntries.push({ start, end });
      if (!activeEndsByStart.has(start)) activeStarts.insert(start);
      activeEndsByStart.set(start, end);
    }
  }

  function earliestCrossing(boundary) {
    while (activeStarts.size > 0) {
      const start = activeStarts.peek();
      const end = activeEndsByStart.get(start);
      if (end > boundary) return start < boundary ? start : null;
      activeStarts.removeRoot();
      activeEndsByStart.delete(start);
    }
    return null;
  }

  function materialize(start, length) {
    const matches = [];
    matches.length = length + 1;
    const orderedStarts = orderedMatchStarts.values;
    let index = orderedMatchStarts.lowerBound(start);
    for (; index < orderedStarts.length; index += 1) {
      const matchStart = orderedStarts[index];
      const offset = matchStart - start;
      if (offset > length) break;
      const end = matchEndsByStart.get(matchStart);
      if (end === undefined) continue;
      matches[offset] = end - start;
    }
    return matches;
  }

  function discardThrough(boundary) {
    while (endEntryHead < endEntries.length && endEntries[endEntryHead].end <= boundary) {
      const { start, end } = endEntries[endEntryHead++];
      if (matchEndsByStart.get(start) === end) matchEndsByStart.delete(start);
      else staleEndEntryCount -= 1;
    }
    orderedMatchStarts.discardInactive();
    if (staleEndEntryCount > 1024) compactStaleEntries();
    if (endEntryHead > 1024 && endEntryHead * 2 >= endEntries.length) {
      endEntries.splice(0, endEntryHead);
      endEntryHead = 0;
    }
  }

  function compactStaleEntries() {
    let writeIndex = endEntryHead;
    for (let readIndex = endEntryHead; readIndex < endEntries.length; readIndex += 1) {
      const entry = endEntries[readIndex];
      if (matchEndsByStart.get(entry.start) !== entry.end) continue;
      endEntries[writeIndex++] = entry;
    }
    endEntries.length = writeIndex;
    staleEndEntryCount = 0;
  }

  return Object.freeze({ add, earliestCrossing, materialize, discardThrough });
}

function isValidInterval(interval) {
  return (
    interval !== null &&
    typeof interval === "object" &&
    Number.isSafeInteger(interval.start) &&
    Number.isSafeInteger(interval.end) &&
    interval.start >= 0 &&
    interval.end > interval.start
  );
}
