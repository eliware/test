/** Convert a structured toolkit result to the numeric process exit code. */
export function toProcessExitCode(result) {
  if (Number.isInteger(result)) return result;
  if (result && Number.isInteger(result.code)) return result.code;
  throw new TypeError('Toolkit result must contain an integer code');
}
