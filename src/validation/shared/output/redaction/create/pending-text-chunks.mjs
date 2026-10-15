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

  function codeUnitsAtBoundary(index) {
    const length = written - consumed;
    if (!Number.isInteger(index) || index < 0 || index > length)
      return { previous: Number.NaN, next: Number.NaN };
    if (length === 0) return { previous: Number.NaN, next: Number.NaN };
    const previousPosition = index > 0 ? consumed + index - 1 : -1;
    const nextPosition = index < length ? consumed + index : -1;
    const position = nextPosition === -1 ? previousPosition : nextPosition;
    let low = head;
    let high = chunks.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const chunk = chunks[middle];
      if (chunk.start + chunk.text.length <= position) low = middle + 1;
      else high = middle;
    }
    const chunkIndex = low;
    const chunk = chunks[chunkIndex];
    const previous =
      previousPosition === -1
        ? Number.NaN
        : previousPosition >= chunk.start
          ? chunk.text.charCodeAt(previousPosition - chunk.start)
          : chunks[chunkIndex - 1].text.at(-1).charCodeAt(0);
    const next =
      nextPosition === -1 ? Number.NaN : chunk.text.charCodeAt(nextPosition - chunk.start);
    return { previous, next };
  }

  function toString() {
    if (head >= chunks.length) return "";
    // Chunks are references, not copied text; join creates the single bounded string the matcher needs.
    const textChunks = [chunks[head].text.slice(consumed - chunks[head].start)];
    for (let index = head + 1; index < chunks.length; index += 1)
      textChunks.push(chunks[index].text);
    return textChunks.join("");
  }

  function clear() {
    chunks.length = 0;
    head = 0;
    consumed = written;
  }

  return Object.freeze({
    append,
    takePrefix,
    codeUnitsAtBoundary,
    toString,
    clear,
    get length() {
      return written - consumed;
    },
  });
}
