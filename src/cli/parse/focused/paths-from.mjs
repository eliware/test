import parseJestArguments from "../jest-arguments.mjs";
import getFocusedTestPaths from "./test-paths.mjs";
function focusedPathsFrom(args = []) {
  return getFocusedTestPaths(parseJestArguments(args).positional, "positional");
}
export default focusedPathsFrom;
