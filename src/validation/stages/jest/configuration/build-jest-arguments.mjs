import {
  focusedPathFrom,
  focusedPathsFrom,
  parseFocusedArguments,
} from "../../../../cli/parse-focused-arguments.mjs";

export { focusedPathFrom };

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
];
const wrapperOwnedOptionAliases = new Set(
  wrapperOwnedOptions.flatMap((option) => {
    const kebab = option.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
    return [option, `--${option}`, `--${kebab}`, `--no-${option}`, `--no-${kebab}`];
  }),
);
wrapperOwnedOptionAliases.add("-c");

export function buildJestArguments(args = []) {
  for (const argument of args) {
    if (typeof argument === "string" && wrapperOwnedOptionAliases.has(argument.split("=", 1)[0]))
      throw new Error(`Jest option ${argument.split("=", 1)[0]} is controlled by eliware-test.`);
  }
  const { forwardedTestPaths } = parseFocusedArguments(args);
  const focusedPaths = focusedPathsFrom(args);
  if (focusedPaths.length > 0 && forwardedTestPaths.length > 0)
    throw new Error("Focused test paths must be supplied before the -- separator.");
  const forwarded = args.filter(
    (argument) => !focusedPaths.includes(argument) && argument !== "--debug-timing",
  );
  const concurrency = ["--runInBand"];
  return [
    "--coverage",
    ...(focusedPaths.length > 0 ? ["--runTestsByPath", ...focusedPaths] : []),
    ...concurrency,
    ...forwarded,
  ];
}
