import { isLauncher } from "../../is/launcher.mjs";
import { readStaticString } from "../../read-static-string.mjs";
import { visitAst } from "../../visit-ast.mjs";
import { isModuleLoadCall } from "../../is/module-load-call.mjs";
import { isTestToolSpecifier } from "../../test-tool-patterns.mjs";
import { isTestToolCommand } from "../../command-patterns.mjs";
import { collectCommandStrings } from "../collect/command-strings.mjs";
import { findImportSpecifier } from "../find-import-specifier.mjs";

export function visitTestToolUse(program, strings, launchNames, allowHarnessTools) {
  return visitAst(program, (node) => {
    const specifier = findImportSpecifier(node, strings);
    if (
      specifier &&
      isTestToolSpecifier(specifier) &&
      !(allowHarnessTools && specifier === "istanbul-lib-instrument")
    )
      return true;
    if (
      isModuleLoadCall(node) &&
      node.arguments.some((argument) =>
        isTestToolSpecifier(readStaticString(argument, strings) ?? ""),
      )
    )
      return true;
    if (node.type === "CallExpression" && isLauncher(node.callee, launchNames)) {
      const command = collectCommandStrings(node.arguments, strings).join(" ");
      if (isTestToolCommand(command, allowHarnessTools)) return true;
    }
    return false;
  });
}
