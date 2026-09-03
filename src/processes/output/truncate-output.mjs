export const MAX_OUTPUT = 16 * 1024;
const OUTPUT_HEAD = 4 * 1024;
const TRUNCATION_PREFIX = '\n[Output truncated: ';
const TRUNCATION_SUFFIX = ' characters omitted.]\n';

/** Keep diagnostics bounded while retaining both the beginning and end. */
export function boundOutput(output) {
  if (typeof output !== 'string') return '';
  if (output.length <= MAX_OUTPUT) return output;
  const omitted = output.length - MAX_OUTPUT;
  const marker = `${TRUNCATION_PREFIX}${omitted}${TRUNCATION_SUFFIX}`;
  const contentBudget = Math.max(0, MAX_OUTPUT - marker.length);
  const headLength = Math.min(OUTPUT_HEAD, contentBudget);
  return `${output.slice(0, headLength)}${marker}${output.slice(-Math.max(0, contentBudget - headLength))}`;
}

/** Append a chunk and immediately enforce the output limit. */
export function appendBounded(output, chunk) {
  const safeOutput = typeof output === 'string' ? output : '';
  const safeChunk = typeof chunk === 'string' ? chunk : '';
  return boundOutput(safeChunk.length > MAX_OUTPUT ? safeChunk : safeOutput + safeChunk);
}
