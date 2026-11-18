import isLauncher from "../../../is/launcher.mjs";
import isTestToolCommand from "../../../command-patterns.mjs";
import collectCommandStrings from "../../collect/command-strings.mjs";

export default function isProhibitedTestToolCommand(node, strings, launchNames, allowHarnessTools) {
  if (node.type !== "CallExpression" || !isLauncher(node.callee, launchNames)) return false;
  const command = collectCommandStrings(node.arguments, strings).join(" ");
  return isTestToolCommand(command, allowHarnessTools);
}
