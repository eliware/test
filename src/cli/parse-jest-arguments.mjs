const valueOptions = new Set([
  "--config",
  "--coverageDirectory",
  "--coverageThreshold",
  "--collectCoverageFrom",
  "--changedSince",
  "--findRelatedTests",
  "--maxConcurrency",
  "--maxWorkers",
  "--outputFile",
  "--preset",
  "--projects",
  "--rootDir",
  "--runTestsByPath",
  "--selectProjects",
  "--shard",
  "--testEnvironment",
  "--testMatch",
  "--testNamePattern",
  "--testPathPattern",
  "--testRegex",
  "--testRunner",
  "--testSequencer",
  "--testTimeout",
  "--transform",
  "--transformIgnorePatterns",
  "--watchPathIgnorePatterns",
  "--reporters",
  "--env",
  "--resolver",
  "--setupFiles",
  "--setupFilesAfterEnv",
  "--moduleNameMapper",
  "--modulePathIgnorePatterns",
  "--testLocationInResults",
  "--coverageReporters",
  "--coveragePathIgnorePatterns",
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
