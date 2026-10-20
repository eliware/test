export function readPendingCodeUnitsAtBoundary(chunks, head, consumed, written, index) {
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
  const next = nextPosition === -1 ? Number.NaN : chunk.text.charCodeAt(nextPosition - chunk.start);
  return { previous, next };
}
