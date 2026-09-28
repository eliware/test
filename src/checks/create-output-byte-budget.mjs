function truncateTextToBytes(text, byteLimit) {
  const encoded = Buffer.from(text);
  if (encoded.length <= byteLimit) return text;
  for (let end = byteLimit; end > 0; end -= 1) {
    const candidateBytes = encoded.subarray(0, end);
    const candidate = candidateBytes.toString("utf8");
    if (Buffer.byteLength(candidate) <= byteLimit && Buffer.from(candidate).equals(candidateBytes))
      return candidate;
  }
  return "";
}

export function createOutputByteBudget(limit) {
  let capturedBytes = 0;
  const output = { stdout: "", stderr: "" };

  return {
    append(stream, text) {
      const remaining = Math.max(0, limit - capturedBytes);
      const bounded = truncateTextToBytes(text, remaining);
      capturedBytes += Buffer.byteLength(bounded);
      output[stream] += bounded;
    },
    truncate: (text) => truncateTextToBytes(text, limit),
    output,
    isFull: () => capturedBytes >= limit,
  };
}
