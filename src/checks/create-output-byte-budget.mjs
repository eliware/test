function truncateTextToBytes(text, byteLimit) {
  const encoded = Buffer.from(text);
  if (encoded.length <= byteLimit) return text;
  const firstEnd = Math.min(byteLimit, encoded.length);
  const lastEnd = Math.max(0, firstEnd - 3);
  for (let end = firstEnd; end >= lastEnd; end -= 1) {
    const candidateBytes = encoded.subarray(0, end);
    const candidate = candidateBytes.toString("utf8");
    if (Buffer.byteLength(candidate) <= byteLimit && Buffer.from(candidate).equals(candidateBytes))
      return candidate;
  }
  return "";
}

export function createOutputByteBudget(limit) {
  let capturedBytes = 0;
  const chunks = { stdout: [], stderr: [] };

  return {
    append(stream, text) {
      const remaining = Math.max(0, limit - capturedBytes);
      const bounded = truncateTextToBytes(text, remaining);
      capturedBytes += Buffer.byteLength(bounded);
      if (bounded) chunks[stream].push(bounded);
    },
    truncate: (text) => truncateTextToBytes(text, limit),
    get output() {
      return {
        stdout: chunks.stdout.join(""),
        stderr: chunks.stderr.join(""),
      };
    },
    isFull: () => capturedBytes >= limit,
  };
}
