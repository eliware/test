export function createEndEntryStore(matchEndsByStart, discardInactive) {
  const entries = [];
  let head = 0;
  let staleCount = 0;

  function add(start, end, previousEnd) {
    if (previousEnd > 0) staleCount += 1;
    entries.push({ start, end });
  }

  function discardThrough(boundary) {
    while (head < entries.length && entries[head].end <= boundary) {
      const { start, end } = entries[head++];
      if (matchEndsByStart.get(start) === end) matchEndsByStart.delete(start);
      else staleCount -= 1;
    }
    discardInactive();
    if (staleCount > 1024) compactStaleEntries();
    if (head > 1024 && head * 2 >= entries.length) {
      entries.splice(0, head);
      head = 0;
    }
  }

  function compactStaleEntries() {
    let writeIndex = head;
    for (let readIndex = head; readIndex < entries.length; readIndex += 1) {
      const entry = entries[readIndex];
      if (matchEndsByStart.get(entry.start) !== entry.end) continue;
      entries[writeIndex++] = entry;
    }
    entries.length = writeIndex;
    staleCount = 0;
  }

  return Object.freeze({ add, discardThrough });
}
