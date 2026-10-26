import {
  focusedPathFrom,
  focusedPathsFrom,
  parseFocusedArguments,
} from "../../../../cli/parse/focused-arguments.mjs";
import { validateJestOptionPolicy } from "./jest-option-policy.mjs";

export { focusedPathFrom };

export function buildJestArguments(args = []) {
  validateJestOptionPolicy(args);
  const { forwardedTestPaths } = parseFocusedArguments(args);
  const focusedPaths = focusedPathsFrom(args);
  if (focusedPaths.length > 0 && forwardedTestPaths.length > 0)
    throw new Error("Focused test paths must be supplied before the -- separator.");
  const forwarded = args.filter(
    (argument) => !focusedPaths.includes(argument) && argument !== "--debug-timing",
  );
  const requiredOptions = ["--runInBand", "--detectOpenHandles", "--no-cache"];
  return [
    "--coverage",
    ...(focusedPaths.length > 0 ? ["--runTestsByPath", ...focusedPaths] : []),
    ...requiredOptions,
    ...forwarded,
  ];
}
