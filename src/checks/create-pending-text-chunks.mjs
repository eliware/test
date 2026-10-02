export function createPendingTextChunks() {
  const chunks = [];
  let head = 0;
  let length = 0;

  function append(text) {
    if (!text) return;
    chunks.push(text);
    length += text.length;
  }

  function takePrefix(prefixLength) {
    let remaining = Math.min(prefixLength, length);
    const prefix = [];
    while (remaining > 0) {
      const first = chunks[head];
      const count = Math.min(remaining, first.length);
      prefix.push(first.slice(0, count));
      if (count === first.length) head += 1;
      else chunks[head] = first.slice(count);
      remaining -= count;
      length -= count;
    }
    if (head > 1024 && head * 2 >= chunks.length) {
      chunks.splice(0, head);
      head = 0;
    }
    return prefix.join("");
  }

  function toString() {
    return chunks.slice(head).join("");
  }

  function clear() {
    chunks.length = 0;
    head = 0;
    length = 0;
  }

  return Object.freeze({
    append,
    takePrefix,
    toString,
    clear,
    get length() {
      return length;
    },
  });
}
