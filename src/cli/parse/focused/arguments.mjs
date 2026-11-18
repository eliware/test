import parseJestArguments from "../jest-arguments.mjs";
import getFocusedTestPaths from "./test-paths.mjs";
export default function parseFocusedArguments(args = []) {
  const parsed = parseJestArguments(args);
  return {
    positional: parsed.positional,
    optionValues: parsed.optionValues,
    forwardedTestPaths: getFocusedTestPaths(parsed.afterSeparator),
  };
}
