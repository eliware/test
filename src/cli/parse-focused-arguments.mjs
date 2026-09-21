const valueOptions = new Set([
  "--config", "--coverageDirectory", "--coverageThreshold", "--collectCoverageFrom",
  "--changedSince", "--findRelatedTests", "--maxWorkers", "--outputFile", "--preset",
  "--rootDir", "--selectProjects", "--testEnvironment", "--testMatch", "--testNamePattern",
  "--testPathPattern", "--testRegex", "--testTimeout", "--watchPathIgnorePatterns",
]);

export function parseFocusedArguments(args = []) {
  const positional = [];
  const optionValues = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (typeof argument !== "string" || argument === "--" || argument.startsWith("-")) continue;
    const previous = args[index - 1];
    if (typeof previous === "string" && valueOptions.has(previous)) optionValues.add(argument);
    else if (!optionValues.has(argument)) positional.push(argument);
  }
  return { positional, optionValues };
}

export function focusedPathFrom(args = []) {
  return parseFocusedArguments(args).positional.find((argument) =>
    /^(?:tests?|specs?)(?:[\\/]|$)/iu.test(argument));
}
