import parseJestArguments from "../jest-arguments.mjs";
import getFocusedTestPaths from "./test-paths.mjs";
function focusedPathFrom(args = []) {
  return getFocusedTestPaths(parseJestArguments(args).positional, "positional")[0];
}
export default focusedPathFrom;
