import truncateOutputTextToBytes from "../output-byte-budget.mjs";

function createOutputByteBudget(limit) {
  let capturedBytes = 0;
  const chunks = {
    stdout: [],
    stderr: [],
  };
  return {
    append(stream, text) {
      if (stream !== "stdout" && stream !== "stderr") return "";
      const remaining = Math.max(0, limit - capturedBytes);
      const bounded = truncateOutputTextToBytes(text, remaining);
      capturedBytes += bounded.byteLength;
      if (bounded.text) chunks[stream].push(bounded.text);
      return bounded.text;
    },
    truncate: (text) => truncateOutputTextToBytes(text, limit).text,
    get output() {
      return {
        stdout: chunks.stdout.join(""),
        stderr: chunks.stderr.join(""),
      };
    },
    get remaining() {
      return Math.max(0, limit - capturedBytes);
    },
    get capturedBytes() {
      return capturedBytes;
    },
    isFull: () => capturedBytes >= limit,
  };
}
export default createOutputByteBudget;
