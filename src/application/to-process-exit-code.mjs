/** Convert a structured toolkit result to the numeric process exit code. */
export function toProcessExitCode(result) {
  if (result && Number.isInteger(result.code)) return result.code;
  throw new TypeError('Toolkit result must be a structured result containing an integer code');
}
