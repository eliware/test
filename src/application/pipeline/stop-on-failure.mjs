import { normalizeStageResult } from './stage-result.mjs';

/**
 * Preserve the pipeline's numeric stage contract while also accepting the
 * normalized command-result objects used by modular stages.
 */
export function stopOnFailure(result) {
  const code = Number.isInteger(result) ? result : normalizeStageResult(result).code;
  return code !== 0;
}
