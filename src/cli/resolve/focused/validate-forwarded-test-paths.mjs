export function validateForwardedTestPaths(forwardedTestPaths, hasToolMode) {
  if (forwardedTestPaths.length === 0) return null;
  return hasToolMode
    ? "Focused test paths cannot be combined with tool modes."
    : "Focused test paths must be supplied before the -- separator.";
}
