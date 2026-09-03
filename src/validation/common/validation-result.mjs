/** Normalize validation-stage process results to a safe diagnostic shape. */
export function normalizeValidationResult(result) {
  return {
    ...result,
    code: Number.isInteger(result?.code) ? result.code : 1,
    output: typeof result?.output === 'string' ? result.output : ''
  };
}

/** Return whether a validation-stage result has exit code zero. */
export function validationSucceeded(result) {
  return normalizeValidationResult(result).code === 0;
}
