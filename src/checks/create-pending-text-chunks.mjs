export function createPendingTextChunks() {
  const chunks = [];
  let head = 0;
  let consumed = 0;
  let written = 0;

  function append(text) {
    if (!text) return;
    chunks.push({ text, start: written });
    written += text.length;
  }

  function takePrefix(prefixLength) {
    const end = Math.min(written, consumed + Math.max(0, prefixLength));
    let position = consumed;
    const prefix = [];
    while (position < end) {
      const chunk = chunks[head];
      const chunkEnd = chunk.start + chunk.text.length;
      const nextPosition = Math.min(end, chunkEnd);
      prefix.push(chunk.text.slice(position - chunk.start, nextPosition - chunk.start));
      position = nextPosition;
      if (position === chunkEnd) head += 1;
    }
    consumed = end;
    if (head > 1024 && head * 2 >= chunks.length) {
      chunks.splice(0, head);
      head = 0;
    }
    return prefix.join("");
  }

  function codeUnitAt(index) {
    if (!Number.isInteger(index) || index < 0 || index >= written - consumed) return Number.NaN;
    const position = consumed + index;
    let low = head;
    let high = chunks.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const chunk = chunks[middle];
      if (chunk.start + chunk.text.length <= position) low = middle + 1;
      else high = middle;
    }
    const chunk = chunks[low];
    return chunk.text.charCodeAt(position - chunk.start);
  }

  function toString() {
    if (head >= chunks.length) return "";
    const first = chunks[head];
    return [
      first.text.slice(consumed - first.start),
      ...chunks.slice(head + 1).map(({ text }) => text),
    ].join("");
  }

  function clear() {
    chunks.length = 0;
    head = 0;
    consumed = written;
  }

  return Object.freeze({
    append,
    takePrefix,
    codeUnitAt,
    toString,
    clear,
    get length() {
      return written - consumed;
    },
  });
}
