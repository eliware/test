const wrapperOwnedOptions = [
  "collectCoverage",
  "coverage",
  "coverageDirectory",
  "coverageReporters",
  "collectCoverageFrom",
  "reporters",
  "outputFile",
  "json",
  "runTestsByPath",
  "testPathPattern",
  "testPathPatterns",
  "testMatch",
  "testRegex",
  "findRelatedTests",
  "changedSince",
  "config",
  "runInBand",
  "detectOpenHandles",
  "cache",
];
const wrapperOwnedOptionAliases = new Set(
  wrapperOwnedOptions.flatMap((option) => {
    const kebab = option.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
    return [option, `--${option}`, `--${kebab}`, `--no-${option}`, `--no-${kebab}`];
  }),
);
wrapperOwnedOptionAliases.add("-c");

export function validateJestOptionPolicy(args) {
  for (const argument of args)
    if (typeof argument === "string" && wrapperOwnedOptionAliases.has(argument.split("=", 1)[0]))
      throw new Error(`Jest option ${argument.split("=", 1)[0]} is controlled by eliware-test.`);
}
