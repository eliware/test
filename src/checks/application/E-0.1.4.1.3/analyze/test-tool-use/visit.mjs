import visitAst from "../../visit-ast.mjs";
import isProhibitedTestToolImport from "./is-prohibited/import.mjs";
import isProhibitedTestToolCommand from "./is-prohibited/command.mjs";
export default function visitTestToolUse(program, strings, launchNames, allowHarnessTools) {
  return visitAst(
    program,
    (node) =>
      isProhibitedTestToolImport(node, strings, allowHarnessTools) ||
      isProhibitedTestToolCommand(node, strings, launchNames, allowHarnessTools),
  );
}
