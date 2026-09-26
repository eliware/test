import { focusedPathFrom } from "../../../../cli/parse-focused-arguments.mjs";

export { focusedPathFrom };

const wrapperOwnedOptions = new Set([
  "--coverage",
  "--no-coverage",
  "--coverageDirectory",
  "--coverageReporters",
  "--collectCoverageFrom",
  "--reporters",
  "--outputFile",
  "--json",
  "--runTestsByPath",
  "--testPathPattern",
]);

export function buildJestArguments(args = []) {
  for (const argument of args) {
    if (typeof argument === "string" && wrapperOwnedOptions.has(argument.split("=", 1)[0]))
      throw new Error(`Jest option ${argument.split("=", 1)[0]} is controlled by eliware-test.`);
  }
  const focusedPath = focusedPathFrom(args);
  const forwarded = args.filter(
    (argument) =>
      argument !== focusedPath &&
      argument !== "--debug-timing",
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
