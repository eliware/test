export function createJestOutputCapture({ maxLength }) {
  const output = { stdout: [], stderr: [] };
  const chunks = [];
  let length = 0;
  let truncated = false;

  return {
    append(stream, chunk) {
      if (!Object.hasOwn(output, stream) || truncated) return "";
      const text = String(chunk);
      const value = text.slice(0, maxLength - length);
      if (value) {
        output[stream].push(value);
        chunks.push(value);
        length += value.length;
      }
      if (value.length < text.length) truncated = true;
      return value;
    },
    snapshot() {
      return { output, captured: chunks.join(""), truncated };
    },
  };
}
