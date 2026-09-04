export function coverageArguments(sourceFiles) {
  return sourceFiles.flatMap((source) => ['--collectCoverageFrom', source]);
}
