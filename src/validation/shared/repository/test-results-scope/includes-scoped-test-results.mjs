import includesTestResultsAt from "../test-results-scope.mjs";

function includesScopedTestResults(scopePath, includeTestResults, includeTestResultsUnder) {
  let current = "";
  for (const segment of scopePath.split("/")) {
    current = current ? `${current}/${segment}` : segment;
    if (
      segment === "test-results" &&
      !includesTestResultsAt(current, includeTestResults, includeTestResultsUnder)
    )
      return false;
  }
  return true;
}
export default includesScopedTestResults;
