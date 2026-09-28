export function createMatchIntervalIndex() {
  const matchEndsByStart = new Map();
  const activeEndsByStart = new Map();
  const activeStarts = [];
  const endEntries = [];
  let endEntryHead = 0;
  let staleEndEntryCount = 0;

  function add(matches) {
    for (const { start, end } of matches) {
      const previousEnd = matchEndsByStart.get(start) ?? 0;
      if (end <= previousEnd) continue;
      if (previousEnd > 0) staleEndEntryCount += 1;
      matchEndsByStart.set(start, end);
      // The matcher emits intervals in increasing end order, so this index is a queue.
      endEntries.push({ start, end });
      if (!activeEndsByStart.has(start)) insert(activeStarts, start, compareNumbers);
      activeEndsByStart.set(start, end);
    }
  }

  function earliestCrossing(boundary) {
    while (activeStarts.length > 0) {
      const start = activeStarts[0];
      const end = activeEndsByStart.get(start);
      if (end > boundary) return start < boundary ? start : null;
      removeRoot(activeStarts, compareNumbers);
      activeEndsByStart.delete(start);
    }
    return null;
  }

  function materialize(start, length) {
    return Array.from({ length: length + 1 }, (_, offset) => {
      const end = matchEndsByStart.get(start + offset);
      return end === undefined ? 0 : end - start;
    });
  }

  function discardThrough(boundary) {
    while (endEntryHead < endEntries.length && endEntries[endEntryHead].end <= boundary) {
      const { start, end } = endEntries[endEntryHead++];
      if (matchEndsByStart.get(start) === end) matchEndsByStart.delete(start);
      else staleEndEntryCount -= 1;
    }
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

function insert(heap, value, compare) {
  heap.push(value);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (compare(heap[parent], value) <= 0) break;
    heap[index] = heap[parent];
    index = parent;
  }
  heap[index] = value;
}

function removeRoot(heap, compare) {
  const root = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    let index = 0;
    while (index * 2 + 1 < heap.length) {
      let child = index * 2 + 1;
      if (child + 1 < heap.length && compare(heap[child + 1], heap[child]) < 0) child += 1;
      heap[index] = heap[child];
      index = child;
    }
    heap[index] = last;
  }
  return root;
}

function compareNumbers(left, right) {
  return left - right;
}
