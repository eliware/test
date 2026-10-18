const valueOptions = new Set([
  "--config",
  "--cacheDirectory",
  "--coverageDirectory",
  "--coveragePathIgnorePatterns",
  "--coverageProvider",
  "--coverageThreshold",
  "--coverageReporters",
  "--collectCoverageFrom",
  "--changedSince",
  "--filter",
  "--findRelatedTests",
  "--globalSetup",
  "--globalTeardown",
  "--globals",
  "--haste",
  "--ignoreProjects",
  "--maxConcurrency",
  "--maxWorkers",
  "--moduleDirectories",
  "--moduleFileExtensions",
  "--outputFile",
  "--moduleNameMapper",
  "--modulePathIgnorePatterns",
  "--modulePaths",
  "--notifyMode",
  "--openHandlesTimeout",
  "--preset",
  "--prettierPath",
  "--projects",
  "--reporters",
  "--rootDir",
  "--roots",
  "--runTestsByPath",
  "--runner",
  "--seed",
  "--selectProjects",
  "--setupFiles",
  "--setupFilesAfterEnv",
  "--shard",
  "--testEnvironment",
  "--testEnvironmentOptions",
  "--testFailureExitCode",
  "--testLocationInResults",
  "--testMatch",
  "--testNamePattern",
  "--testPathIgnorePatterns",
  "--testPathPatterns",
  "--testPathPattern",
  "--testRegex",
  "--testResultsProcessor",
  "--testRunner",
  "--testSequencer",
  "--testTimeout",
  "--transform",
  "--transformIgnorePatterns",
  "--unmockedModulePathPatterns",
  "--watchPathIgnorePatterns",
  "--workerGracefulExitTimeout",
  "--env",
  "--resolver",
  "--snapshotSerializers",
  "--watchPlugins",
  "-c",
  "-w",
  "-t",
  "-o",
]);

export function parseJestArguments(args = []) {
  const positional = [];
  const optionValues = new Set();
  const afterSeparator = [];
  let separated = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") {
      separated = true;
      continue;
    }
    if (typeof argument !== "string" || argument.startsWith("-")) continue;
    const previous = args[index - 1];
    if (typeof previous === "string" && valueOptions.has(previous)) optionValues.add(argument);
    else if (separated) afterSeparator.push(argument);
    else if (!optionValues.has(argument)) positional.push(argument);
  }
  return { positional, optionValues, afterSeparator };
}
