import focusedPathFrom from "../../../../cli/parse/focused-arguments/focused/path-from.mjs";
import focusedPathsFrom from "../../../../cli/parse/focused-arguments/focused/paths-from.mjs";
import parseFocusedArguments from "../../../../cli/parse/focused-arguments.mjs";
import validateJestOptionPolicy from "./jest-option-policy.mjs";
export { focusedPathFrom };
export default function buildJestArguments(args = []) {
  validateJestOptionPolicy(args);
  const { forwardedTestPaths } = parseFocusedArguments(args);
  const focusedPaths = focusedPathsFrom(args);
  if (focusedPaths.length > 0 && forwardedTestPaths.length > 0)
    throw new Error("Focused test paths must be supplied before the -- separator.");
  const forwarded = args.filter(
    (argument) => !focusedPaths.includes(argument) && argument !== "--debug-timing",
  );
  return [
    "--coverage",
    "--cache",
    ...(focusedPaths.length > 0 ? ["--runTestsByPath", ...focusedPaths] : []),
    ...forwarded,
  ];
}
