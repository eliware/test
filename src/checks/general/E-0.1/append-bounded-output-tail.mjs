export function appendBoundedOutputTail(current, chunk, maximumLength) {
  const text = chunk.toString();
  if (text.length >= maximumLength) return text.slice(-maximumLength);
  return `${current.slice(-(maximumLength - text.length))}${text}`;
}
