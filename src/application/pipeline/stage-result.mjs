/**
 * Convert a stage's process result into the small, predictable shape used by
 * the application pipeline. Missing or malformed exit codes are failures so
 * that an incomplete stage cannot accidentally allow validation to continue.
 */
export function normalizeStageResult(result) {
  if (result === undefined || result === null) return { code: 1, output: '' };
  return {
    ...result,
    code: Number.isInteger(result.code) ? result.code : 1,
    output: typeof result.output === 'string' ? result.output : ''
  };
}

/** Return whether a stage completed successfully. */
export function stageSucceeded(result) {
  return normalizeStageResult(result).code === 0;
}
