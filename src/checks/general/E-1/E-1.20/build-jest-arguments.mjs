import { focusedPathFrom } from "../../../../cli/parse-focused-arguments.mjs";

export { focusedPathFrom };

export function buildJestArguments(args = []) {
  const focusedPath = focusedPathFrom(args);
  const forwarded = args.filter(
    (argument) =>
      argument !== focusedPath &&
      argument !== "--ignore-100x4" &&
      argument !== "--ignore-monolith-limits" &&
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
