export const MAX_PROCESS_OUTPUT_LENGTH = 100_000;

export function appendBoundedOutput(current, chunk, maxLength = MAX_PROCESS_OUTPUT_LENGTH) {
  const output = `${current}${chunk}`;
  return output.length > maxLength ? `${output.slice(0, maxLength)}…` : output;
}
