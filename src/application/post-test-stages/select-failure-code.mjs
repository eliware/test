/** Select the highest failure code so later-stage diagnostics are preserved. */
export function selectFailureCode(...results) {
  const failures = results.filter((code) => Number.isInteger(code) && code > 0);
  return failures.length ? Math.max(...failures) : null;
}
