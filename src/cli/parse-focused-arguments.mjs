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

export function parseFocusedArguments(args = []) {
  const positional = [];
  const optionValues = new Set();
  const forwardedTestPaths = [];
  let afterSeparator = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") {
      afterSeparator = true;
      continue;
    }
    if (typeof argument !== "string" || argument.startsWith("-")) continue;
    const previous = args[index - 1];
    if (typeof previous === "string" && valueOptions.has(previous)) {
      optionValues.add(argument);
    } else if (afterSeparator) {
      if (
        /^tests[\\/].+\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/iu.test(argument) ||
        /^[A-Za-z]:[\\/]/u.test(argument) ||
        argument.startsWith("/") ||
        argument.startsWith("\\\\")
      )
        forwardedTestPaths.push(argument);
    } else if (!optionValues.has(argument)) positional.push(argument);
  }
  return { positional, optionValues, forwardedTestPaths };
}

export function focusedPathFrom(args = []) {
  return parseFocusedArguments(args).positional.find((argument) =>
    /^tests(?:[\\/]|$)/iu.test(argument),
  );
}
