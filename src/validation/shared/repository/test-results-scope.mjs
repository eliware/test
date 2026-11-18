export default function includesTestResultsAt(
  directoryPath,
  includeTestResults,
  includeTestResultsUnder,
) {
  const parent = directoryPath.slice(0, directoryPath.lastIndexOf("/"));
  return (
    includeTestResults ||
    includeTestResultsUnder.some((scope) => parent === scope || parent.startsWith(`${scope}/`))
  );
}
