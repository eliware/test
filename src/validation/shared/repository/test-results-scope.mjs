export function includesTestResultsAt(directoryPath, includeTestResults, includeTestResultsUnder) {
  const parent = directoryPath.slice(0, directoryPath.lastIndexOf("/"));
  return (
    includeTestResults ||
    includeTestResultsUnder.some((scope) => parent === scope || parent.startsWith(`${scope}/`))
  );
}

export function includesScopedTestResults(scopePath, includeTestResults, includeTestResultsUnder) {
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
