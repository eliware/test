/** Normalize the loosely shaped child-process result returned by Jest. */
export function normalizeTestResult(result) {
  return {
    ...result,
    code: Number.isInteger(result?.code) ? result.code : 1,
    output: typeof result?.output === 'string' ? result.output : '',
  };
}
