export function createOrderedMatchStartIndex(isActive) {
  const starts = [];
  let head = 0;

  function insert(start) {
    if (starts.length === head || start > starts.at(-1)) {
      starts.push(start);
      return;
    }
    const index = lowerBound(start);
    starts.splice(index, 0, start);
  }

  function lowerBound(start) {
    let low = head;
    let high = starts.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (starts[middle] < start) low = middle + 1;
      else high = middle;
    }
    return low;
  }

  function discardInactive() {
    while (head < starts.length && !isActive(starts[head])) head += 1;
    if (head > 1024 && head * 2 >= starts.length) {
      starts.splice(0, head);
      head = 0;
    }
  }

  return Object.freeze({ insert, lowerBound, discardInactive, values: starts });
}
