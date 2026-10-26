import { createNumericMinHeap } from "../numeric-min-heap.mjs";

export function createActiveStarts() {
  const activeEndsByStart = new Map();
  const starts = createNumericMinHeap();

  function set(start, end) {
    if (!activeEndsByStart.has(start)) starts.insert(start);
    activeEndsByStart.set(start, end);
  }

  function earliestCrossing(boundary) {
    while (starts.size > 0) {
      const start = starts.peek();
      const end = activeEndsByStart.get(start);
      if (end > boundary) return start < boundary ? start : null;
      starts.removeRoot();
      activeEndsByStart.delete(start);
    }
    return null;
  }

  return Object.freeze({ set, earliestCrossing });
}
