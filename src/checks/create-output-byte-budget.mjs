export function truncateOutputTextToBytes(text, byteLimit) {
  const encoded = Buffer.from(text);
  if (encoded.length <= byteLimit) return { text, byteLength: encoded.length };
  let end = Math.max(0, Math.min(byteLimit, encoded.length));
  if (end < encoded.length && (encoded[end] & 0xc0) === 0x80) {
    while (end > 0 && (encoded[end] & 0xc0) === 0x80) end -= 1;
  }
  const bounded = encoded.subarray(0, end);
  return { text: bounded.toString("utf8"), byteLength: end };
}

export function createOutputByteBudget(limit) {
  let capturedBytes = 0;
  const chunks = { stdout: [], stderr: [] };

  return {
    append(stream, text) {
      const remaining = Math.max(0, limit - capturedBytes);
      const bounded = truncateOutputTextToBytes(text, remaining);
      capturedBytes += bounded.byteLength;
      if (bounded.text) chunks[stream].push(bounded.text);
    },
    truncate: (text) => truncateOutputTextToBytes(text, limit).text,
    get output() {
      return {
        stdout: chunks.stdout.join(""),
        stderr: chunks.stderr.join(""),
      };
    },
    isFull: () => capturedBytes >= limit,
  };
}
