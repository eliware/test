export const MAX_PROCESS_OUTPUT_LENGTH = 100_000;

export function appendBoundedOutput(current, chunk, maxLength = MAX_PROCESS_OUTPUT_LENGTH) {
  const output = `${current}${chunk}`;
  if (output.length <= maxLength) return output;
  const marker = "…";
  return `${output.slice(0, Math.max(0, maxLength - marker.length))}${marker}`;
}
