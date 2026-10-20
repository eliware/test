import { readPendingCodeUnitsAtBoundary } from "./pending-text-chunks/code-units-at-boundary.mjs";

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
    return readPendingCodeUnitsAtBoundary(chunks, head, consumed, written, index);
  }

  function toString() {
    if (head >= chunks.length) return "";

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
