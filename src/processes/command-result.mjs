/** Normalize every child-process outcome before it reaches a validator. */
export function normalizeCommandResult(result) {
  return {
    ...result,
    code: Number.isInteger(result?.code) && result.code >= 0 ? result.code : 1,
    output: typeof result?.output === 'string' ? result.output : ''
  };
}

/** Return whether a normalized child process exited successfully. */
export function commandSucceeded(result) {
  return normalizeCommandResult(result).code === 0;
}
