import { focusedPathFrom } from "../../../../cli/parse-focused-arguments.mjs";

export { focusedPathFrom };

const wrapperOwnedOptions = new Set([
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
]);
const shortOptionNames = new Map([["-c", "config"]]);

function canonicalOption(argument) {
  const option = argument.split("=", 1)[0];
  if (shortOptionNames.has(option)) return shortOptionNames.get(option);
  return option
    .replace(/^--no-/u, "--")
    .replace(/^--/u, "")
    .replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}

export function buildJestArguments(args = []) {
  for (const argument of args) {
    if (typeof argument === "string" && wrapperOwnedOptions.has(canonicalOption(argument)))
      throw new Error(`Jest option ${argument.split("=", 1)[0]} is controlled by eliware-test.`);
  }
  const focusedPath = focusedPathFrom(args);
  const forwarded = args.filter(
    (argument) => argument !== focusedPath && argument !== "--debug-timing",
  );
  const concurrency = ["--runInBand"];
  const timing = args.includes("--debug-timing") ? ["--json"] : [];
  return [
    "--coverage",
    ...timing,
    ...(focusedPath ? ["--runTestsByPath", focusedPath] : []),
    ...concurrency,
    ...forwarded,
  ];
}
