import { focusedPathFrom } from "../../../../cli/parse-focused-arguments.mjs";

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
  const focusedPath = focusedPathFrom(args);
  const forwarded = args.filter(
    (argument) => argument !== focusedPath && argument !== "--debug-timing",
  );
  const concurrency = ["--runInBand"];
  return [
    "--coverage",
    "--json",
    ...(focusedPath ? ["--runTestsByPath", focusedPath] : []),
    ...concurrency,
    ...forwarded,
  ];
}
